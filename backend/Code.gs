function doPost(e) {
  // CORS対策: 常にJSONを返す準備
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    // 1. データの解析
    // postDataがない場合（テスト実行時など）のエラーハンドリング
    if (!e || !e.postData) {
      throw new Error("No data received");
    }
    const data = JSON.parse(e.postData.contents);
    const userName = data.name;
    const userEmail = data.email;
    const reserveDate = data.date; // 例: "3日"
    const reserveTime = data.time; // 例: "14:00 - 14:30"

    // 2. スプレッドシートへの記録
    // アクティブなスプレッドシートを取得（このスクリプトが紐付いているシート）
    // シートがない場合は作成するロジックも本来は入るが、今回は「シート1」固定で想定
    // 確実にスプレッドシートを取得するためにID指定に変更
    let ss = SpreadsheetApp.openById('1eCgiQzOgUsxvUAk-6xr30k3fUNHU2JdTewme4VWUWEA');
    let sheet = ss.getSheetByName('予約一覧');
    if (!sheet) {
      sheet = ss.insertSheet('予約一覧');
      // ヘッダー行を追加
      sheet.appendRow(['タイムスタンプ', '氏名', 'メールアドレス', '希望日', '希望時間', 'ステータス']);
    }
    
    sheet.appendRow([
      new Date(),
      userName,
      userEmail,
      reserveDate,
      reserveTime,
      '未対応'
    ]);

    // 3. カレンダー登録 (デモ用: 今日の日付で時間をセット)
    // 本来は日付を正しくパースする必要がありますが、シンプルにするため「明日の指定時間」として仮登録します
    const calendar = CalendarApp.getDefaultCalendar();
    const startTimeStr = reserveTime.split(' - ')[0]; // "14:00"
    const now = new Date();
    const startHour = parseInt(startTimeStr.split(':')[0]);
    const startMin = parseInt(startTimeStr.split(':')[1]);
    
    // 明日の日付を作成
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, startHour, startMin);
    const endDate = new Date(startDate.getTime() + 30 * 60000); // 30分後

    calendar.createEvent(`【カウンセリング】${userName}様`, startDate, endDate, {
      description: `メール: ${userEmail}\n希望枠: ${reserveDate} ${reserveTime}`
    });

    // 4. メール送信
    // 管理者（自分）へ通知
    // 【セキュリティ修正】メールアドレスはコードに書かず、スクリプトプロパティから取得
    const adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');

    if (adminEmail) {
      GmailApp.sendEmail(adminEmail, '【新規予約】カウンセリング申し込みがありました', 
        `名前: ${userName}\nメール: ${userEmail}\n日時: ${reserveDate} ${reserveTime}\n\nスプレッドシートを確認してください。`
      );
    } else {
      // プロパティ未設定時のログ出力（デバッグ用）
      console.log("管理者メールアドレス（ADMIN_EMAIL）がスクリプトプロパティに設定されていません。");
    }

    // ユーザーへ自動返信
    GmailApp.sendEmail(userEmail, '【Executive English】カウンセリングのご予約ありがとうございます',
      `${userName} 様\n\nお申し込みありがとうございます。\n以下の日時でご予約を承りました。\n\n日時: 明日 ${reserveTime} (デモ用に日付を自動設定しています)\nZoom URL: https://zoom.us/j/example12345\n\n当日お話しできることを楽しみにしております。\n\n------------------------------\nExecutive English Coaching`
    );

    // 成功レスポンス
    output.setContent(JSON.stringify({ status: 'success', message: '予約が完了しました' }));

  } catch (error) {
    // エラーレスポンス
    output.setContent(JSON.stringify({ status: 'error', message: error.toString() }));
  }

  return output;
}

function doGet(e) {
  // 動作確認用
  return ContentService.createTextOutput("GAS Web App is running!");
}
