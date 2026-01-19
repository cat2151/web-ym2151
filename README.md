# web-ym2151

## 状況
- 動かない可能性が非常に高いです
- LLMに生成させただけで未確認です

### compile
```bash
emcc sine_test.c -O3 -s WASM=1 -s EXPORTED_FUNCTIONS="['_generate_sine','_free_buffer']" -s EXPORTED_RUNTIME_METHODS="['cwrap','getValue']" -o sine_test.js
```

