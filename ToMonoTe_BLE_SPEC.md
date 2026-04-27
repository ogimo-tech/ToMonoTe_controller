# とものて BLE通信仕様 / ToMonoTe BLE Communication Spec

とものて (ToMonoTe) は ESP32 上で動作するコミュニケーションロボットです。
BLE GATT を使ってスマートフォン・タブレットからモーションを遠隔操作できます。

---

## 1. BLE 接続情報

| 項目 | 値 |
|------|-----|
| デバイス名プレフィックス | `ToMonoTe-BLE-XXXX` ※末尾4文字はMACアドレス下2バイト |
| Service UUID | `B1E00030-5011-4B52-8E2D-9B1C3D4E5F60` |
| Characteristic UUID | `B1E00031-5011-4B52-8E2D-9B1C3D4E5F60` |
| プロパティ | Write (Write Without Response も可) |

---

## 2. コマンド仕様

### 基本フォーマット

```
#TOM + <命令コード> + <パラメータ>
```

| フィールド | バイト数 | 内容 |
|-----------|---------|------|
| `#TOM` | 4バイト | 固定プレフィックス（全命令共通） |
| `<命令コード>` | 2バイト | 命令の種別を示すコード（下記参照） |
| `<パラメータ>` | 命令による | 命令コードごとに定義 |

**エンコード: UTF-8 テキスト**

---

### 命令コード一覧

| 命令コード | 内容 | ステータス |
|-----------|------|-----------|
| `FM` | モーション実行 (FingerMotion) | 実装済み |
| その他 | 今後追加予定 | — |

---

### FM 命令（モーション実行）

```
#TOMFM<NNN>
```

| フィールド | 内容 |
|-----------|------|
| `#TOM` | 固定プレフィックス |
| `FM` | モーション実行命令 |
| `<NNN>` | モード番号 3桁ゼロ埋め (例: `005`, `015`, `051`) |

**合計 9バイト**

#### 例

```
#TOMFM005   → はい
#TOMFM009   → ありがとう
#TOMFM004   → じゃんけんランダム
```

---

## 3. モード一覧（FM命令）

### じゃんけん

| モード番号 | 動作 |
|-----------|------|
| 1 | グー |
| 2 | チョキ |
| 3 | パー |
| 4 | ランダム（グー/チョキ/パーをランダムに実行） |

### あいさつ・感情表現

| モード番号 | 動作 | モード番号 | 動作 |
|-----------|------|-----------|------|
| 5 | はい | 6 | いいえ |
| 7 | おはよう | 8 | いってきます |
| 9 | ありがとう | 10 | バイバイ |
| 11 | やったー | 12 | お願いします |
| 13 | おつかれさま | 14 | ただいま |
| 15 | こんにちは | 16 | ゲッツ！ |
| 17 | なんでやねん | 18 | がんばれ |
| 19 | なるほど・それな | 20 | いいね |
| 21 | めっちゃおもろいやん | 22 | はくしゅ |
| 23 | もういいわ | 24 | マリオコイン |
| 25 | どーもー | 26 | 注目！ |
| 27 | 先生 | 28 | 遊ぼう！ |
| 29 | 嬉しい | 30 | 大好きー！ |
| 31 | 行く | 32 | 行かない |
| 33 | ナイス！ | 34 | どんまい |
| 35 | おめでとう | 36 | またお願いします |
| 37 | どうぞー | 38 | ねぇねぇ |
| 39 | はい（ゆっくり） | 40 | いいえ（ゆっくり） |
| 41 | おまかせします | 42 | HELLO |
| 43 | OK | 44 | THANK YOU |
| 45 | Good Bye | 46 | サイコー |
| 47 | いってらっしゃい | 48 | がんばるぞ |
| 49 | たすけて | 50 | よろしく |
| 51 | いらっしゃいませ | | |

---

## 4. 実装サンプル (Web Bluetooth API / JavaScript)

```javascript
const SVC_UUID  = 'b1e00030-5011-4b52-8e2d-9b1c3d4e5f60';
const CHAR_UUID = 'b1e00031-5011-4b52-8e2d-9b1c3d4e5f60';

// BLE 接続
async function connect() {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: 'ToMonoTe-BLE-' }],
    optionalServices: [SVC_UUID]
  });
  const server  = await device.gatt.connect();
  const service = await server.getPrimaryService(SVC_UUID);
  const char    = await service.getCharacteristic(CHAR_UUID);
  return char;
}

// FM命令: モーション送信
async function sendMotion(char, modeNumber) {
  const cmd = '#TOMFM' + String(modeNumber).padStart(3, '0');
  await char.writeValue(new TextEncoder().encode(cmd));
}

// 使用例
const char = await connect();
await sendMotion(char, 9);   // → ありがとう
await sendMotion(char, 4);   // → じゃんけんランダム
```

---

## 5. 注意事項

- **iOS / iPadOS**: Safari は Web Bluetooth API 非対応。**[Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492912960)** アプリ（App Store）を使用してください。
- **Android / Windows**: Chrome ブラウザで Web Bluetooth API が使用できます。
- 複数デバイスが近くにある場合、デバイス名末尾4文字（MACアドレス由来）でロボット個体を識別できます。
- コマンドに対するレスポンス（返信）はありません。モーション実行は一方向の送信のみです。

---

## 6. 参考

- コントローラ WebApp: https://ogimo-tech.github.io/ToMonoTe_controller/
- ソースコード: https://github.com/ogimo-tech/ToMonoTe_controller
