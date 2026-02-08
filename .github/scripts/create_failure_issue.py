import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request


def load_event():
    with open(os.environ["GITHUB_EVENT_PATH"], "r", encoding="utf-8") as fp:
        return json.load(fp)["workflow_run"]


def github_request(method, url, token, payload=None):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "ci-failure-issue-script",
    }
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            return resp.getcode(), json.loads(content.decode("utf-8")) if content else None
    except urllib.error.HTTPError as error:
        return error.code, None


def ensure_label(base_url, owner, repo, token, label):
    status, _ = github_request(
        "GET", f"{base_url}/repos/{owner}/{repo}/labels/{urllib.parse.quote(label)}", token
    )
    if status == 404:
        github_request(
            "POST",
            f"{base_url}/repos/{owner}/{repo}/labels",
            token,
            {"name": label, "color": "B60205", "description": "Created automatically when CI workflows fail"},
        )


def search_issue(base_url, owner, repo, token, title, label):
    query = f'repo:{owner}/{repo} is:issue is:open label:"{label}" in:title {title}'
    q = urllib.parse.quote(query)
    status, data = github_request("GET", f"{base_url}/search/issues?q={q}&per_page=100", token)
    if status != 200 or not data:
        return None
    for item in data.get("items", []):
        if "pull_request" not in item and item.get("title") == title:
            return item
    return None


def get_issue(base_url, owner, repo, token, number):
    return github_request("GET", f"{base_url}/repos/{owner}/{repo}/issues/{number}", token)


def comment_issue(base_url, owner, repo, token, number, body):
    return github_request(
        "POST", f"{base_url}/repos/{owner}/{repo}/issues/{number}/comments", token, {"body": body}
    )


def create_issue(base_url, owner, repo, token, title, body, labels):
    return github_request(
        "POST", f"{base_url}/repos/{owner}/{repo}/issues", token, {"title": title, "body": body, "labels": labels}
    )


def main():
    repo = os.environ["GITHUB_REPOSITORY"]
    owner, name = repo.split("/", 1)
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("GITHUB_TOKEN is required", file=sys.stderr)
        sys.exit(1)

    workflow_run = load_event()
    workflow_name = workflow_run["name"]
    run_url = workflow_run["html_url"]
    head_branch = workflow_run.get("head_branch") or "unknown"
    head_sha = workflow_run.get("head_sha") or ""
    short_sha = head_sha[:7] if head_sha else "unknown"
    title = f"[CI] {workflow_name} failure on {head_branch}"
    body = "\n".join(
        [
          f"{workflow_name} workflow failed.",
          "",
          "## Details",
          f"- Branch: `{head_branch}`",
          f"- Commit: `{short_sha}`",
          f"- Event: `{workflow_run.get('event')}`",
          f"- Workflow run: {run_url}",
        ]
    )
    label = "ci-failure"
    base_url = os.environ.get("GITHUB_API_URL", "https://api.github.com")

    ensure_label(base_url, owner, name, token, label)
    existing = search_issue(base_url, owner, name, token, title, label)

    if existing:
        status, issue = get_issue(base_url, owner, name, token, existing["number"])
        if status in (404, 410) or not issue or issue.get("state") != "open":
            existing = None

    if existing:
        comment_body = "\n".join(
            [
                "Another failure detected.",
                "",
                f"- Branch: `{head_branch}`",
                f"- Commit: `{short_sha}`",
                f"- Workflow run: {run_url}",
            ]
        )
        comment_status, _ = comment_issue(base_url, owner, name, token, existing["number"], comment_body)
        if comment_status >= 400:
            existing = None

    if not existing:
        status, _ = create_issue(base_url, owner, name, token, title, body, [label, "bug"])
        if status >= 300:
            print(f"Failed to create issue (status {status})", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
