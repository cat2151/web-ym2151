#!/bin/bash
set -e

# =============================================================================
# web-ym2151 ビルドスクリプト
# Emscriptenのインストール、ビルド、ローカルサーバー起動を一括実行する
# =============================================================================

# 設定
EMSDK_DIR="$HOME/emsdk"
PORT=8000

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# ユーティリティ関数
# =============================================================================

# メッセージ出力（情報）
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# メッセージ出力（警告）
print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# メッセージ出力（エラー）
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# セクション区切り
print_section() {
    echo ""
    echo "========================================="
    echo " $1"
    echo "========================================="
}

# =============================================================================
# Windowsファイルシステムチェック
# =============================================================================

check_not_windows_filesystem() {
    print_section "実行環境チェック"
    
    local current_path=$(pwd)
    
    # /mnt/で始まるパスをチェック（WSL）
    if [[ "$current_path" == /mnt/* ]]; then
        print_error "Windowsファイルシステム上で実行しようとしている"
        print_error "現在のパス: $current_path"
        echo ""
        print_info "これは腰抜けのやることだ"
        print_info "Emscriptenはパーミッションやシンボリックリンクの問題で失敗する"
        echo ""
        print_info "以下のコマンドでLinux側にコピーしてから実行しろ:"
        echo "  cp -r $current_path ~/web-ym2151"
        echo "  cd ~/web-ym2151"
        echo "  ./build.sh"
        return 1
    fi
    
    # /cygdrive/で始まるパスをチェック（Cygwin）
    if [[ "$current_path" == /cygdrive/* ]]; then
        print_error "Windowsファイルシステム上で実行しようとしている"
        print_error "現在のパス: $current_path"
        echo ""
        print_info "Linux側のパスで実行しろ"
        return 1
    fi
    
    # dfコマンドでファイルシステムタイプをチェック
    if command -v df &> /dev/null; then
        local fs_type=$(df -T "$current_path" 2>/dev/null | tail -n 1 | awk '{print $2}')
        
        # drvfs, 9p, vboxsf などはWindowsマウント
        if [[ "$fs_type" == "drvfs" ]] || [[ "$fs_type" == "9p" ]] || [[ "$fs_type" == "vboxsf" ]]; then
            print_error "Windowsファイルシステム上で実行しようとしている"
            print_error "ファイルシステムタイプ: $fs_type"
            echo ""
            print_info "Linux側のパス（ext4など）で実行しろ"
            return 1
        fi
    fi
    
    print_info "実行環境は適切だ（Linuxネイティブファイルシステム）"
    return 0
}

# =============================================================================
# システム依存関係チェック
# =============================================================================

check_dependencies() {
    print_section "システム依存関係チェック"
    
    local missing_deps=()
    
    # 必須ツールのチェック
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi
    
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    fi
    
    if ! command -v cmake &> /dev/null; then
        missing_deps+=("cmake")
    fi
    
    if ! command -v make &> /dev/null; then
        missing_deps+=("make")
    fi
    
    # 依存関係が不足している場合
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "以下のツールがインストールされていない:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        print_info "以下のコマンドでインストールしろ:"
        echo "  sudo apt update"
        echo "  sudo apt install -y git python3 cmake build-essential"
        return 1
    fi
    
    print_info "すべての依存関係が満たされている"
    return 0
}

# =============================================================================
# Emscripten SDK インストール
# =============================================================================

install_emsdk() {
    print_section "Emscripten SDK インストール"
    
    if [ -d "$EMSDK_DIR" ]; then
        print_info "既存のEmscripten SDKが見つかった: $EMSDK_DIR"
        return 0
    fi
    
    print_info "Emscripten SDKをクローン中..."
    git clone https://github.com/emscripten-core/emsdk.git "$EMSDK_DIR"
    
    print_info "インストール完了"
    return 0
}

# =============================================================================
# Emscripten SDK セットアップ
# =============================================================================

setup_emsdk() {
    print_section "Emscripten SDK セットアップ"
    
    if [ ! -d "$EMSDK_DIR" ]; then
        print_error "Emscripten SDKディレクトリが見つからない: $EMSDK_DIR"
        return 1
    fi
    
    cd "$EMSDK_DIR"
    
    print_info "最新版のEmscriptenをインストール中..."
    ./emsdk install latest
    
    print_info "Emscriptenをアクティベート中..."
    ./emsdk activate latest
    
    cd - > /dev/null
    
    print_info "セットアップ完了"
    return 0
}

# =============================================================================
# Emscripten 環境の読み込み
# =============================================================================

load_emsdk_env() {
    print_section "Emscripten 環境読み込み"
    
    if [ ! -f "$EMSDK_DIR/emsdk_env.sh" ]; then
        print_error "emsdk_env.sh が見つからない"
        print_info "先にEmscripten SDKをインストールする必要がある"
        return 1
    fi
    
    source "$EMSDK_DIR/emsdk_env.sh"
    
    if ! command -v emcc &> /dev/null; then
        print_error "emccコマンドが見つからない"
        return 1
    fi
    
    print_info "Emscripten環境を読み込んだ"
    emcc --version | head -n 1
    
    return 0
}

# =============================================================================
# ビルド実行
# =============================================================================

build_project() {
    print_section "プロジェクトビルド"
    
    # ソースファイルの存在確認
    if [ ! -f "sine_test.c" ]; then
        print_error "sine_test.c が見つからない"
        print_info "プロジェクトのルートディレクトリで実行しろ"
        return 1
    fi
    
    if [ ! -f "opm.c" ]; then
        print_error "opm.c が見つからない"
        return 1
    fi
    
    print_info "コンパイル中..."
    
    emcc sine_test.c opm.c -O3 \
      -s WASM=1 \
      -s EXPORTED_FUNCTIONS="['_generate_sound','_get_sample','_free_buffer','_malloc','_free']" \
      -s EXPORTED_RUNTIME_METHODS="['cwrap','getValue','HEAPU8']" \
      -o sine_test.js
    
    if [ $? -ne 0 ]; then
        print_error "ビルドが失敗した"
        return 1
    fi
    
    print_info "ビルド完了"
    
    # 成果物の確認
    if [ -f "sine_test.js" ] && [ -f "sine_test.wasm" ]; then
        print_info "成果物:"
        ls -lh sine_test.js sine_test.wasm | awk '{print "  " $9 " (" $5 ")"}'
    else
        print_error "成果物が見つからない"
        return 1
    fi
    
    return 0
}

# =============================================================================
# ローカルサーバー起動
# =============================================================================

start_server() {
    print_section "ローカルサーバー起動"
    
    if [ ! -f "index.html" ]; then
        print_warn "index.html が見つからない"
    fi
    
    print_info "ポート $PORT でサーバーを起動する"
    print_info "ブラウザで以下にアクセスしろ:"
    echo ""
    echo "  http://localhost:$PORT/"
    echo ""
    print_info "サーバーを停止するには Ctrl+C を押せ"
    echo ""
    
    python3 -m http.server "$PORT"
}

# =============================================================================
# メイン処理
# =============================================================================

main() {
    local skip_install=false
    local skip_build=false
    local skip_server=false
    
    # コマンドライン引数の解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-install)
                skip_install=true
                shift
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-server)
                skip_server=true
                shift
                ;;
            --build-only)
                skip_server=true
                shift
                ;;
            --server-only)
                skip_install=true
                skip_build=true
                shift
                ;;
            --help|-h)
                echo "使用法: $0 [オプション]"
                echo ""
                echo "オプション:"
                echo "  --skip-install   Emscriptenのインストールをスキップ"
                echo "  --skip-build     ビルドをスキップ"
                echo "  --skip-server    サーバー起動をスキップ"
                echo "  --build-only     ビルドのみ実行（サーバー起動しない）"
                echo "  --server-only    サーバーのみ起動（インストール・ビルドしない）"
                echo "  --help, -h       このヘルプを表示"
                echo ""
                echo "例:"
                echo "  $0                    # すべて実行"
                echo "  $0 --build-only       # ビルドのみ"
                echo "  $0 --server-only      # サーバーのみ"
                echo "  $0 --skip-install     # インストールをスキップしてビルド・サーバー起動"
                exit 0
                ;;
            *)
                print_error "不明なオプション: $1"
                echo "ヘルプを表示するには --help を使え"
                exit 1
                ;;
        esac
    done
    
    print_section "web-ym2151 ビルドスクリプト"
    
    # Windowsファイルシステムチェック（最優先）
    if ! check_not_windows_filesystem; then
        exit 1
    fi
    
    # システム依存関係チェック
    if ! check_dependencies; then
        exit 1
    fi
    
    # Emscripten SDKのインストールとセットアップ
    if [ "$skip_install" = false ]; then
        if ! install_emsdk; then
            exit 1
        fi
        
        if ! setup_emsdk; then
            exit 1
        fi
    fi
    
    # Emscripten環境の読み込み
    if [ "$skip_build" = false ]; then
        if ! load_emsdk_env; then
            exit 1
        fi
        
        # ビルド実行
        if ! build_project; then
            exit 1
        fi
    fi
    
    # ローカルサーバー起動
    if [ "$skip_server" = false ]; then
        start_server
    else
        print_section "完了"
        print_info "ビルドが完了した"
        print_info "サーバーを起動するには以下を実行しろ:"
        echo "  $0 --server-only"
    fi
}

# スクリプト実行
main "$@"
