# DreamCloud 素材プレースホルダー一覧

素材が未提供の箇所は `src/components/asset-placeholder.tsx` の無地グレー表示で置き換える。画像の寸法・切り抜きは各UI側の `StyleSheet.create` で指定する。

## 追加するスキャナー素材

以下のパスとファイル名で配置する。画像形式はPNGを想定。

```text
assets/
	images/
		scanner/
			earth-night.png
			cloud-logo.png
			scanner-mascot.png
```

| ファイル | 表示位置 | 差し替え先 |
| --- | --- | --- |
| `assets/images/scanner/earth-night.png` | スキャナーカード下部の地球背景 | `src/features/scanner-card.tsx` のearth画像領域（配置済み） |
| `assets/images/scanner/cloud-logo.png` | 電信IDの下、カード中央寄り。青い9ドットを含む | `src/features/scanner-card.tsx` の雲ロゴ領域（配置済み） |
| `assets/images/scanner/scanner-mascot.png` | 「街をスキャンする」ボタン左側 | `src/features/scanner-card.tsx` の人物画像領域（配置済み） |

電信IDの文字はiOS標準の`ui-rounded`（SF Pro Rounded）を使うため、フォントファイルの追加は不要。

| 素材 | 使用箇所 | 差し替え先・位置 | 対応フェーズ |
| --- | --- | --- | --- |
| 電信結界 / DreamCloud ロゴ | 共通ヘッダーの左上。マップでは上部中央 | `src/components/app-header.tsx` のロゴ領域 | P2 / P6 |
| ログイン・退出アイコン | 共通ヘッダー右側、プロフィールアバター左 | `src/components/app-header.tsx` の右側アイコン領域 | P2 |
| アバター写真 | 共通ヘッダー右端の円形領域 | `src/components/app-header.tsx` のアバター位置 | P2 |
| NFCクラウドロゴ | 待機・検出中の正方形カード中央 | `src/features/profile-card.tsx` の円内中央 | P2 |
| プロフィールキャラクター | 電信IDカードの中央 | `src/features/profile-card.tsx` のアバター領域 | P2 |
| バーコード画像 | 電信IDカード下端 | `src/features/profile-card.tsx` の下部中央 | P2 |
| 夜の街の写真 | プロフィールカード下部の背景 | `src/features/profile-card.tsx` の下部背景領域 | P2 |
| スキャナークラウドロゴ | スキャナーカード上部中央 | `src/features/scanner-card.tsx` のロゴ領域 | P3 |
| 地球の夜景画像 | スキャナーカード下部から全面拡大表示 | `src/features/scanner-card.tsx` の背景領域 | P3〜P5 |
| スキャナー案内キャラクター | 「街をスキャンする」ボタン左側 | `src/features/scanner-card.tsx` のボタン左端 | P3 |
| マップ上の人物・発信機イラスト | 各エリアのマーカー上 | `src/features/map-screen.tsx` のマーカービュー | P7 |
| マップ上部のゴースト・現在地アイコン | エリア選択行の右側 | `src/features/map-screen.tsx` の操作領域 | P6 |
| 日本語タイトル・DreamCloudロゴ用フォント | ロゴおよびカード内見出し | 共通ヘッダーと各カードの文字領域 | P2 / P3 / P6 |

ヘッダー、プロフィール面、マップ用の素材は未提供のためplaceholderを継続する。P1のカード面は仕様どおり無地。