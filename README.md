# discordjs-twitchNotification  
Twitchで配信開始した際に、Discordへ通知するbot。予め、配信者リスト登録と条件指定が必要。  
使用用途が、speedrun配信の通知なので、コマンドはそれに合わせた名称になっております。  
配信者リスト登録は、コマンドから可能。  
登録するIDは、Twitchのユーザー名。（表示名ではないので注意）  
csvファイルでCRUD操作を行います。([csv-database](https://github.com/ysnglt/node-csvdb))  
## 条件([Twitch API Reference](https://dev.twitch.tv/docs/api/reference#search-categories)を参照)  
- ゲームID(game_id)  
- タグID(tags_ids)  
## コマンドリスト
- hi：挨拶兼動作確認。  
- !addRunner：配信者の追加コマンド。重複防止付き。  
- !delRunner：配信者の削除コマンド。  
- !runnerList：登録されている配信者の一覧を表示する。  

## 事前準備
```
git clone https://github.com/Chien789626/discordjs-twitchNotification.git
cd discordjs-twitchNotification
npm install
mkdir db
touch config.json
```
config.jsonへ、以下のように設定を行う  
```
{
    "prefix": "!",  
    "regexp": "/^[0-9a-zA-Z]*$/",  
    "game_id": [{game_id}],  
    "tag": "tag_id",  
    "token": "Your token",  
    "client_id": "Your client id",  
    "Authorization": "Bearer Authorization",  
    "csvFilePath": "./db/streamerList.csv"  
}
```
