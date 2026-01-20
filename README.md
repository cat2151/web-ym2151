# web-ym2151

## 状況
- 最低限の実装をした状態です
  - 440Hzが鳴ります
- 機能追加中

## 概要
- ブラウザで440Hzの音を鳴らします

## 用途
- これを、他projectのcoding agentが参照して実装に役立てることができるか？の検証用です

## 制約
- 実用には、ここから大規模な追加実装や、アーキテクチャの変更が必要です

## install / build
- Windowsの場合は、WSLかつ、/mnt/ でないほう（~/ など）でのみbuildできます。/mnt/ 配下で失敗するのは、Emscriptenの仕様です

## いろいろ
- 開発方針の軸、優先度を、体験の検証ができるよう実装、とする
    - 機能の案、簡易 tone editor、jsonを出力
        - 狙い
            - 少しさわるだけで音色が変わる体験の提供
                - 最低限の体験
                    - JSON編集よりは、だいぶ楽
                    - 既存の高機能エディタに遠く及ばないのは割り切る、後回し
        - 備忘
            - ym2151-tone-editor はネイティブTUIなため、ブラウザには持ってこれない
                - なのでブラウザ版で仮UIを作る用途はある
        - 仕様案、仮
            - 4つのopのparam to reg 簡易変換
                - 取り急ぎ4行、11列？用意するくらいでいい
                    - 最小限の実装
                    - O1,O3,O2,O4の並びのままでいい
            - 1つのCON FL など to reg 簡易変換
                - slot maskはO1,O2,O3,O4の並びのままでいい
            - おそらく5行のtextarea1つ、の文字列パースのほうがむしろ楽な可能性がある
                - ※index.html側に多数のUIを用意するよりも楽、くらいの意味
            - preview機能
                - textarea右端にnote numを1つ～8つで、mono～8poly、でpreview
                    - json末尾のnoteを生成するということ
                    - まずmono
                    - polyは後回し
                - note num & oct : 0x00～0x7F
                    - MIDI note num to reg 簡易変換
                        - jsで仮でざっくり実装
                            - Rust版のソースを参考に。tableがある
                            - 上位bitはoctave
    - 機能の案、wav fileをexport
    - 機能の案、local storageに保存して自動load、json export、json import
- 方向性の案
    - wavlpfから利用できるレベルのライブラリに
        - 音色getライブラリ
            - 簡易的な検証用のライブラリ
                - one shot 波形生成
                    - in : 音色json
                    - out : wavファイル
