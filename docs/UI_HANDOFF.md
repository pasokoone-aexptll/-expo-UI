# DreamCloud UI 移植メモ（P9）

2026-10-05。対象はiOS向けのモックUI。元の段階表より、その後のユーザー指示・最新Figma画像を優先している。NFC・通信・認証・実位置情報は未実装で別担当の範囲。

## 完了範囲

| 段階 | 実装済みの範囲 |
| --- | --- |
| P0 | Expo / 型 / hooks / モック / 開発パネル |
| P1 | 左右の3Dカード切り替え、下部タブ、前回カード復元、Splash保持 |
| P2 | NFCモック待機・検出・成功・反転・プロフィール、ゴースト表示 |
| P3 | スキャナー待機カード、素材・取手・地球 |
| P4 | 発見3件・雨ドット・電波・発見件数・キャンセル |
| P5 | 地球の拡大とブラー、カード拡大、マップ遷移、スキャン後の準備完了 |
| P6 | マップ上部の街名・人数・経過時間、戻る・現在地・入力・ゴースト |
| P7 | 区域、ステッカーとID、人物の点と名前、ズーム曲線・押下・長押しメンション |
| P8 | チャット送信・履歴・マスク・文字からのドラッグ、キーボード追従背景 |
| P9 | 地図準備後のピンの段階的ポップイン、操作部の登場演出、本メモ |

「実装済み」は実機での全操作・Figma一致の確認完了を意味しない。最終確認項目は末尾参照。

## 途中で確定した仕様

- 縦カード・隣のカードのチラ見せ・スワイプ案内チップは廃止。横スワイプ＋等幅のスキャナー／ログインタブと取手。
- 未ログインでも街をスキャンできる。ログイン前はゴーストボタンと経過時間を表示しない。
- 一度スキャンが終わるとカードは準備完了になり、次は直接マップを開く。再起動後までの保存はしない。
- マップのエリア選択タブとロゴは廃止。歌舞伎町の街名・人数と、その下に経過時間。
- ゴースト中はゴースト開始からの時間。プロフィールとマップは同じSessionProviderを参照。
- 人物の長押しで地図を寄せ、メンション確認を表示。背景タップ／キャンセルで閉じる。@付きチャットで入力へ挿入。
- 普段は文字行だけがチャットのドラッグを受ける。ドラッグ中にマスクを上へ開き背景をぼかし、指を離すと閉じる。本文の高さは固定。
- 先頭には画面高さ×0.8の余白。本文の基準高さも画面高さとし、先頭まで戻すと最初の行が下側の通常表示窓に残る。
- キーボード表示中は入力欄外の透明レイヤーがタップを受け、点やステッカー上でも入力を閉じる。チャット背景もキーボードと同じ位置アニメーションで追従。

## ファイルと移植境界

`src/app/_layout.tsx` が GestureHandlerRootView / SafeAreaProvider / SessionProvider / Stack を持つ。`src/app/index.tsx` がカード画面と `/map` への遷移、`src/app/map.tsx` が戻りを担当。Routerはルート側に置き、featureへコールバックで渡す。

| hook | 入力 → 出力 | UIの呼び出し箇所・操作 |
| --- | --- | --- |
| `useSession()` | → `status: idle/detecting/success`, `profile: Profile|null`, `onlineSeconds`, `ghostSeconds`, `ghost`, `setGhost(boolean)`, `simulateLogin()`, `logout()`, `reset()` | CardStack→ProfileCard/ScannerCard。MapSceneの時間とトグル。DevPanelの擬似ログイン／リセット |
| `useScan()` | → `status: idle/scanning/done`, `found: FoundUser[]`, `ready: boolean`, `start()`, `reset()` | CardStackが所有。ScannerCardへpropsで渡し、完了後はルートの遷移コールバック |
| `useArea(areaId)` | `kabukicho/ikebukuro/akihabara` → `id,name,headcount,center,zones[]` | MapScene→AreaMap。画面のエリア選択UIは廃止済み |
| `useChat(areaId)` | → `messages: ChatMessage[]`, `send(text:string):void` | MapSceneが送信、MapChatが表示 |

### データの形

- `Profile` = `{electricId, avatar: ImageSourcePropType|null, visitCount, headcount}`。現状のカード中央はデモステッカーで、実画像差し替えはProfileCardも確認する。
- `FoundUser` = `{electricId, headcount, color: blue/red/purple}`。
- 実際の `useArea` のzone = `{key,color,electricId,headcount,coordinate,sticker,boundary: Coordinate[],people: {id,label,coordinate}[]}`。`Coordinate` は `{latitude,longitude}`。
- `ChatMessage` = `{number,senderId,time,body,kind: message/system}`。空文字は送信しない。送信者はモック `*4647`、番号は現在の最大番号+1、時刻は端末のローカル時刻。`@名前` と `>>番号` を着色し、アンカーからの遷移は作っていない。
- `src/types.ts` の旧 `AreaData/Person/Sticker` は現在のzone構造とは異なる。実装の移植では `useArea` の実際の返却形を使う。AreaMapの型は現在 `ReturnType<typeof getMapArea>` を参照する。

### 本物へ差し替えるとき

1. `src/mocks/session-provider.tsx` を実セッションのProviderに差し替える。画面側のContext契約は `src/hooks/useSession.ts`。`simulateLogin/reset` は開発専用であり、認証APIではない。
2. `useScan` のタイマーを実スキャン結果へ差し替える。キャンセル／離脱で購読とタイマーを解除し、古い完了通知で遷移しないようにする。`reset()` は状態と結果だけを戻し、`ready` は維持する現在の契約に注意。
3. `useArea` を実データへ差し替える。AreaMapの `getMapArea` 由来の型も共有DTOへ移す。現時点でMapSceneは固定現在地 `MOCK_LOCATION` を直接参照しているので、実位置情報を導入する際はhook経由に切り替える。
4. `useChat` はMapScene内のメモリーにログを保持し、マップを閉じると破棄される。サーバー購読・送信・メッセージIDを導入する際はこのhookを差し替える。現在の履歴には表示確認用の重複番号／行があるため、実メッセージのIDとして番号を使わない。
5. 保存は `src/storage/card-preference.ts` の `dreamcloud:last-card` のみ（profile/scanner）。セッション、チャット、スキャン結果は永続化していない。

## 演出と調整箇所

| 場所 | 調整対象 |
| --- | --- |
| `features/card-stack.tsx` | カード寸法・3D回転・拡大・タブ・スキャン完了後の遷移タイミング |
| `features/profile-card.tsx` | 雲と文字が離れる演出・ドットのフェード・リング・チェック・反転 |
| `components/rain-cloud.tsx` | 縦3列の独立したドット周期。非表示時の停止 |
| `features/scanner-card.tsx` | 待機／スキャン／全面化のロゴ位置、地球の拡大・ぼかし、発見表示 |
| `features/area-map.tsx` | `PIN_ZOOM_CURVE`（最小0.58／最大1.8／基準0.0015／指数0.8）、広域での名前省略、pitch、ポップイン |
| `features/map-scene.tsx` | 通常表示窓は高さ×0.27。本文は高さ×1、先頭余白は×0.8。背景ぼかしとキーボード追従 |
| `features/map-chat.tsx` | 本文と先頭スペーサーの合計高さを計測しスクロール範囲を決める。本文の高さを開閉中に変えない |

ピンは人物の点の中心、ステッカーは画像下端を地理座標に合わせる。MapKit向けの `centerOffset` と拡大時のtranslateY補正を保持する。登場演出もこの基準点で92%→100%、不透明度0→1。ズーム・タップで再マウントしないため登場演出は繰り返さない。

## iOS / Expo Go の制約

- Apple Mapsはpitch 45度、mutedStandard。`showsBuildings={false}` は指定済みだが、Expo Goの組み込みMapKitでは立体建物が残る場合がある。
- `app.json` の `plugins/with-flat-apple-map.js` がネイティブprebuild時にAIRMap.mmへ平坦な標高設定を追加する。Expo Goには適用されない。iOSビルド担当はこのpluginも移植する。react-native-maps更新時に対象メソッドが変わると明示的にエラーにして再確認を促す。今回の最終検証はiOSのJS書き出しであり、ネイティブビルド／実機の平坦表示は未検証。
- Liquid Glassが使える環境はGlassView、それ以外は白背景のタブ。青の選択グラデーションは共通。
- 角は `borderCurve: continuous` を使用。Figmaのsmoothing 60%という数値をRNで直接指定できる実装ではなく、iOSの連続曲線による近似。円形の点・ピルは円として保持する。
- ブランドロゴ、非常口アイコン、ヘッダーアバターは素材待ちで灰色プレースホルダー。ユーザー指定どおり代替画像は作らない。

## ASSUMED一覧

以下は作成時点でソースにある全 `ASSUMED` コメント。行番号は後続編集で変わる。

- `src/app/index.tsx:43` — ホームインジケーターより上に保つ開発用パネルの余白です。
- `src/components/app-header.tsx:20` — プレースホルダー寸法とSafeArea内のヘッダー余白は画像からの目視近似です。
- `src/components/dev-panel.tsx:24` — 開発パネル内のボタン間隔です。
- `src/components/rain-cloud.tsx:14` — 上段→下段へ明るさが流れる。各列の独立した周期を使う。
- `src/components/rain-cloud.tsx:27` — 列ごとに異なる周期・開始位置。一定の斜めの波を作らない。
- `src/components/scan-signal.tsx:18` — 文字の近くから外側へ、1.2秒周期で電波を送る。
- `src/features/area-map.tsx:28` — 地図の準備後、区域ごとに短い間隔で92%→100%のポップイン。
- `src/features/area-map.tsx:72` — 約500m以上の表示範囲では人名を省き、電信IDは末尾だけにする。
- `src/features/card-stack.tsx:51` — 発見情報が消えてから1.8秒で全面へ拡大する。
- `src/features/card-stack.tsx:96` — ヘッダー・タブ・開発用ボタンの領域を避け、隣のカードは完全に画面外へ置く。
- `src/features/map-scene.tsx:151` — 画像からの寸法近似。ネイティブ地図の道路・文字はApple Mapsの表示に従う。
- `src/features/profile-card.tsx:51` — 上(12時)から白いレールを青線が一周し、チェック→反転。
- `src/features/scanner-card.tsx:83` — 元PNGの地平線は高さの約31%、日本は(x:49%, y:44%)。
- `src/features/scanner-card.tsx:168` — Figma静止画の比率からの目視近似。カード外の寸法・傾きは既存設定を維持。
- `src/hooks/useChat.ts:12` — 投稿者は固定モック。エリア別ログは画面内のメモリーのみ。
- `src/mocks/map-data.ts:3` — 中心座標・ポリゴン・点の配置はUI確認用。実際の結界や現在地ではありません。
- `src/mocks/mock-data.ts:16` — モックのログイン検出時間です。
- `src/mocks/mock-data.ts:19` — スキャン中に発見情報を追加する間隔です。
- `src/theme.ts:1` — pageとsurface以外はFigma画像から目視した近似色です。


## 依存一覧

`package.json` に記録された全依存。今回P9で依存は追加していない。既存テンプレート由来のWeb／Android用依存も含む。導入時は対象Expo SDKに合わせて `npx expo install` を使う。

| 種別 | パッケージ | 指定バージョン |
| --- | --- | --- |
| dependencies | `@expo/ui` | `~57.0.21` |
| dependencies | `@react-native-async-storage/async-storage` | `2.2.0` |
| dependencies | `@react-native-masked-view/masked-view` | `0.3.2` |
| dependencies | `expo` | `~57.0.26` |
| dependencies | `expo-blur` | `~57.0.3` |
| dependencies | `expo-constants` | `~57.0.20` |
| dependencies | `expo-device` | `~57.0.2` |
| dependencies | `expo-font` | `~57.0.4` |
| dependencies | `expo-glass-effect` | `~57.0.4` |
| dependencies | `expo-image` | `~57.0.5` |
| dependencies | `expo-linear-gradient` | `~57.0.2` |
| dependencies | `expo-linking` | `~57.0.11` |
| dependencies | `expo-router` | `~57.0.24` |
| dependencies | `expo-splash-screen` | `~57.0.9` |
| dependencies | `expo-status-bar` | `~57.0.1` |
| dependencies | `expo-symbols` | `~57.0.3` |
| dependencies | `expo-system-ui` | `~57.0.4` |
| dependencies | `expo-web-browser` | `~57.0.3` |
| dependencies | `react` | `19.2.3` |
| dependencies | `react-dom` | `19.2.3` |
| dependencies | `react-native` | `0.86.3` |
| dependencies | `react-native-gesture-handler` | `~2.32.0` |
| dependencies | `react-native-maps` | `1.27.2` |
| dependencies | `react-native-reanimated` | `4.5.1` |
| dependencies | `react-native-safe-area-context` | `~5.7.0` |
| dependencies | `react-native-screens` | `~4.26.0` |
| dependencies | `react-native-svg` | `15.15.4` |
| dependencies | `react-native-web` | `~0.21.0` |
| dependencies | `react-native-worklets` | `0.10.1` |
| devDependencies | `@types/react` | `~19.2.2` |
| devDependencies | `typescript` | `~6.0.3` |

## 最終確認

実行: `npx tsc --noEmit` と `npx expo export --platform ios`。Lintはユーザー指示で実行しない。書き出し成功は実機の描画確認とは別。

Expo Goで `npx expo start` を起動し、以下を確認する。

1. 未ログインでスキャン→途中キャンセル→再スキャン→地球拡大→マップ。戻ると準備完了から直接マップへ入る。
2. 開発パネルでログイン→チェック→反転。プロフィールとマップのオンライン／ゴースト経過時間が一致する。
3. 地図準備後に点とステッカーが順に現れる。ズーム・pitch・押下時も点の中心と画像下端が地図座標からずれない。
4. 人物長押し→メンション確認→キャンセル／外側タップ／@付きチャット。入力中はステッカー上でも外側タップで閉じる。
5. 入力時に背景のぼかし・色と入力欄が一緒に上がる。送信で末尾へ追加される。
6. 文字行を掴むと履歴が上へ開き、離すと元の窓に戻る。余白は地図へタップ透過する。最古のチャットを下まで引いても通常の窓に残る。
7. アプリを再起動すると最後のカードを復元する。iOSネイティブビルドでは斜め視点のまま建物が平坦になることも確認する。

## Logout update (2026-10-06)

The exit icon is now supplied: `assets/images/header/exit.png`. `ExitButton` calls `useSession().logout()` from both screens. The mock provider clears profile, session, online time and ghost state immediately. The map stays open without its online status or ghost button. ProfileCard animates success to idle with a 460ms reverse flip; its display snapshot survives only until the flip completes. Scan readiness is independent of authentication. Replace the hook implementation for real logout; no network is called here.

## Logout progress (2026-10-06)

`useSession().isLoggingOut` controls the shared `LogoutProgress` modal in the root layout. The mock waits 900ms before clearing the session and closing the modal; this supersedes the immediate reset described above. Replace this delay with the real completion signal. Repeated requests are ignored and reset/unmount clears the pending timer.
