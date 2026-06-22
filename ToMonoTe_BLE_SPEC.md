# とものて BLE通信仕様 / ToMonoTe BLE Communication Spec

とものて (ToMonoTe) は、言葉を話せない子どもがクラスメイトと交流するきっかけを作るために開発されたポータブルロボットハンドです。
スイッチ操作で「おはよう」「バイバイ」などの挨拶やじゃんけんを自分の意思で表現できます。
BLE GATT を使ってスマートフォン・タブレットからもモーションを遠隔操作できます。

---

## 1. BLE 接続情報

| 項目 | 値 |
|------|-----|
| デバイス名プレフィックス | `ToMonoTe-BLE-XXXX` ※末尾4文字はデバイス固有の識別子 |
| Service UUID | `B1E00030-5011-4B52-8E2D-9B1C3D4E5F60` |
| RX Characteristic UUID（コマンド送信用） | `B1E00031-5011-4B52-8E2D-9B1C3D4E5F60` / Write・Write Without Response |
| TX Characteristic UUID（パネル取得用） | `B1E00032-5011-4B52-8E2D-9B1C3D4E5F60` / Read・Notify |

> アプリ→本体のコマンド（FM/PS）は **RX特性** へ Write。本体→アプリのパネル情報（PG）は **TX特性** を Read、または変更時の Notify で受信します。

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

| 命令コード | 内容 | 経路 | ステータス |
|-----------|------|------|-----------|
| `FM` | モーション実行 (FingerMotion) | RX(Write) | 実装済み |
| `PS` | パネル設定（クイック操作8個のFM番号を本体に保存） | RX(Write) | 実装済み (v2.1.6) |
| `PG` | パネル取得（本体に記憶された8個を読み出し） | TX(Read/Notify) | 実装済み (v2.1.6) |
| その他 | 今後追加予定 | — | — |

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

### PS 命令（パネル設定）／ PG（パネル取得）

本体は「クイック操作パネル」として **9個のFM番号** を不揮発(NVS)に記憶しています（v2.1.7〜。v2.1.6は8個）。
アプリはこの9個を読み出してユーザー設定メニューを表示し、また書き換えできます。
Web設定画面・BLEのどちらで変更しても同じ値（双方向同期）で、変更時はTX特性へ Notify されます。

#### PS（設定 / アプリ→本体, RX特性へ Write）

```
#TOMPS<NNN>×9
```

| フィールド | 内容 |
|-----------|------|
| `#TOM` | 固定プレフィックス |
| `PS` | パネル設定命令 |
| `<NNN>`×9 | パネル index0〜8 のFM番号、各3桁ゼロ埋め（001〜051） |

**合計 33バイト**。各値は本体側で 1〜51 を検証（範囲外/欠落はその枠の現行値を維持）。保存後 TX を Notify。

例: `#TOMPS001002003015009010020018017`
→ index0..8 = 1(グー),2(チョキ),3(パー),15(こんにちは),9(ありがとう),10(バイバイ),20(いいね),18(がんばれ),17(なんでやねん)

#### PG（取得 / 本体→アプリ, TX特性を Read または Notify）

TX特性（`B1E00032-…`, Read/Notify）の値は常に現在のパネルを表します。

```
#TOMPG<NNN>×9
```

例: `#TOMPG001002003015009010020018017`

- 接続後に TX を **Read** すれば現在の9個を即取得できます。
- Notify を購読しておくと、本体側（Web/BLE）でパネルが変わるたびに最新値が届きます。
- アプリは取得した各FM番号を表示し、操作時は `#TOMFM<NNN>` を RX へ送ってモーション実行します。

> パネルは 3列×3行（index 0..8 = 行優先）を想定。FM番号→名称は本仕様「3. モード一覧」を参照。

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
const SVC_UUID = 'b1e00030-5011-4b52-8e2d-9b1c3d4e5f60';
const RX_UUID  = 'b1e00031-5011-4b52-8e2d-9b1c3d4e5f60'; // Write (FM/PS)
const TX_UUID  = 'b1e00032-5011-4b52-8e2d-9b1c3d4e5f60'; // Read/Notify (PG)

let rxChar, txChar;

// BLE 接続（RX/TX 両特性を取得）
async function connect() {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: 'ToMonoTe-BLE-' }],
    optionalServices: [SVC_UUID]
  });
  const server  = await device.gatt.connect();
  const service = await server.getPrimaryService(SVC_UUID);
  rxChar = await service.getCharacteristic(RX_UUID);
  txChar = await service.getCharacteristic(TX_UUID);
}

// FM命令: モーション送信
async function sendMotion(modeNumber) {
  const cmd = '#TOMFM' + String(modeNumber).padStart(3, '0');
  await rxChar.writeValue(new TextEncoder().encode(cmd));
}

// PG: パネル9個を読み出し（"#TOMPG"+3桁×9 → [n0..n8]）
function parsePanel(str) {
  const body = str.startsWith('#TOMPG') ? str.slice(6) : str;
  const a = [];
  for (let i = 0; i < 9; i++) a.push(parseInt(body.substr(i * 3, 3), 10));
  return a;
}
async function readPanel() {
  const dv = await txChar.readValue();
  return parsePanel(new TextDecoder().decode(dv));
}

// PG: 変更通知を購読（Web/BLEでパネルが変わると発火）
async function subscribePanel(onChange) {
  await txChar.startNotifications();
  txChar.addEventListener('characteristicvaluechanged', (e) => {
    onChange(parsePanel(new TextDecoder().decode(e.target.value)));
  });
}

// PS: パネル9個を本体に保存（FM番号の配列, 長さ9）
async function savePanel(arr9) {
  const cmd = '#TOMPS' + arr9.map(n => String(n).padStart(3, '0')).join('');
  await rxChar.writeValue(new TextEncoder().encode(cmd));
}

// 使用例
await connect();
const panel = await readPanel();          // 例: [1,2,3,15,9,10,20,18,17]
await subscribePanel(p => console.log('panel updated', p));
await sendMotion(panel[0]);                // パネル先頭のアクションを実行
await savePanel([1,2,3, 15,9,10, 20,18,17]); // パネルを書き換え（3×3）
```

---

## 5. 注意事項

- **iOS / iPadOS**: Safari は Web Bluetooth API 非対応。**[Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492912960)** アプリ（App Store）を使用してください。
- **Android / Windows**: Chrome ブラウザで Web Bluetooth API が使用できます。
- 複数デバイスが近くにある場合、デバイス名末尾4文字でロボット個体を識別できます。
- FM（モーション実行）はRX特性への一方向送信でレスポンスはありません。
- パネル情報（PG）はTX特性の Read／Notify で取得します（v2.1.6〜）。PS で設定するとTXへ Notify されます。
- 1メッセージ最大33バイト（パネル9個）。iOS/Android は接続時にMTUを自動拡張するため通常問題ありませんが、購読/読み取りが切れる場合はMTU拡張を確認してください。

---

## 6. 参考

- とものて 紹介ページ: https://protopedia.net/prototype/5011
- コントローラ WebApp: https://ogimo-tech.github.io/ToMonoTe_controller/
