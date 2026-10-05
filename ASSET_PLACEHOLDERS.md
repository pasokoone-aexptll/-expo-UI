# DreamCloud 素材一覧

2026-10-05更新。移植の全体像は `docs/UI_HANDOFF.md` を参照。

## 素材待ち

ユーザー指定どおり、未提供素材は `src/components/asset-placeholder.tsx` の無地グレーで表示する。

| 素材 | 差し替え先 |
| --- | --- |
| 電信結界 / DreamCloudのヘッダーロゴ | `src/components/app-header.tsx` のwordmark |
| ヘッダーのプロフィール写真 | `src/components/app-header.tsx` のavatar |

マップ中央のブランドロゴは後の指示で廃止済み。SF Symbolsを使う戻る・現在地・システムログインアイコンの画像提供は不要。

## 配置・使用済み

| 素材 | 使用箇所 |
| --- | --- |
| `assets/images/login/mono-dream-only.png` | NFC待機の雲。文字と分離してアニメーション |
| `assets/images/login/mono-text-dream.png` | NFCカードのDreamCloud文字 |
| `assets/images/login/dream.png` | NFC検出の青い雲、プロフィールIDの横 |
| `assets/images/login/barcode.png` | NFCカード下端、ゴーストボタンの横 |
| `assets/images/login/demo-sticker.png` | プロフィールと赤い区域 |
| `assets/images/login/tokyo-city-background.png` | プロフィール下部 |
| `assets/images/map/demo2-sticker.png` | 紫の区域 |
| `assets/images/map/demo3-sticker.png` | 青い区域 |
| `assets/images/scanner/earth-night.png` | スキャナーの地球 |
| `assets/images/scanner/scanner-mascot.png` | スキャンボタンのキャラクター |
| `src/components/rain-cloud.tsx` | 提供cloud.svg由来の雲と独立した3列の雨ドット |

旧資料にあった `cloud-logo.png` と `mono-dream.png` の一枚絵は現在のアニメーション構成では使わない。文字・雲・ドットを分離している。プロフィール中央は提供済みデモステッカーを使う。

## Exit icon update (2026-10-06)

`assets/images/header/exit.png` is supplied and used by `src/components/exit-button.tsx` in both the header and map. It calls `useSession().logout()`; it is gray and disabled when logged out.
