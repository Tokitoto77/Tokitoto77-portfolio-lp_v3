function doPost(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    if (!e || !e.postData) throw new Error("No data received");
    const data = JSON.parse(e.postData.contents);
    const userName = data.name;
    const userEmail = data.email;
    const reserveDate = data.date; 
    const reserveTime = data.time;

    // 1. Zoom URLの自動発行（模擬的: ランダム生成）
    const zoomId = Math.floor(Math.random() * 9000000000) + 1000000000;
    const zoomUrl = `https://zoom.us/j/${zoomId}?pwd=ABC123...`; 

    // 2. スプレッドシート記録 (ID指定)
    let ss = SpreadsheetApp.openById('1eCgiQzOgUsxvUAk-6xr30k3fUNHU2JdTewme4VWUWEA');
    let sheet = ss.getSheetByName('予約一覧');
    if (!sheet) {
      sheet = ss.insertSheet('予約一覧');
      // ヘッダー行を追加（Zoom URL列を追加）
      sheet.appendRow(['タイムスタンプ', '氏名', 'メールアドレス', '希望日', '希望時間', 'ステータス', 'Zoom URL']);
    }
    sheet.appendRow([new Date(), userName, userEmail, reserveDate, reserveTime, '未対応', zoomUrl]);

    // 3. カレンダー登録
    // デフォルトでは「メインのカレンダー」を使いますが、
    // スクリプトプロパティ 'CALENDAR_ID' があればそれを使います。
    const calendarId = PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');
    const calendar = calendarId ? CalendarApp.getCalendarById(calendarId) : CalendarApp.getDefaultCalendar();

    const startTimeStr = reserveTime.split(' - ')[0]; 
    const now = new Date();
    const startHour = parseInt(startTimeStr.split(':')[0]);
    const startMin = parseInt(startTimeStr.split(':')[1]);
    
    // 【簡易ロジック】本来は日付パースが必要ですが、デモとして「明日のこの時間」に設定
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, startHour, startMin);
    const endDate = new Date(startDate.getTime() + 30 * 60000); 

    if (calendar) {
        calendar.createEvent(`【カウンセリング】${userName}様`, startDate, endDate, {
        description: `メール: ${userEmail}\n希望枠: ${reserveDate} ${reserveTime}\nZoom: ${zoomUrl}`
        });
    }

    // 4. メール送信（管理者への通知）
    // 管理者アドレスはスクリプトプロパティから取得
    const adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');

    if (adminEmail) {
      GmailApp.sendEmail(adminEmail, '【新規予約】カウンセリング申し込みがありました', 
        `名前: ${userName}\nメール: ${userEmail}\n日時: ${reserveDate} ${reserveTime}\nZoom: ${zoomUrl}\n\nスプレッドシートを確認してください。`
      );
    }

    // ユーザーへ自動返信（Zoom URL付き）
    GmailApp.sendEmail(userEmail, '【Executive English】カウンセリングのご予約ありがとうございます',
      `${userName} 様\n\nお申し込みありがとうございます。\n以下の日時でご予約を承りました。\n\n日時: 明日 ${reserveTime} (デモ用に日付を自動設定しています)\nZoom URL: ${zoomUrl}\n※お時間になりましたら上記URLよりご入室ください。\n\n当日お話しできることを楽しみにしております。`
    );

    output.setContent(JSON.stringify({ status: 'success', message: '予約が完了しました' }));

  } catch (error) {
    output.setContent(JSON.stringify({ status: 'error', message: error.toString() }));
  }
  return output;
}

// リマインドメール（トリガーで毎日実行）
function sendReminders() {
  const ss = SpreadsheetApp.openById('1eCgiQzOgUsxvUAk-6xr30k3fUNHU2JdTewme4VWUWEA');
  const sheet = ss.getSheetByName('予約一覧');
  if (!sheet) return;

  const rows = sheet.getDataRange().getValues();
  rows.shift(); // ヘッダー除去
  
  // 「明日」の日付（例: 10日）を作成してマッチング
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowDateStr = `${tomorrow.getDate()}日`; 

  rows.forEach((row) => {
    // 列インデックス: 0:Timestamp, 1:Name, 2:Email, 3:Date, 4:Time, 5:Status, 6:ZoomURL
    const name = row[1];
    const email = row[2];
    const dateStr = row[3]; 
    const timeStr = row[4];
    const zoomUrl = row[6] || "（メールにて通知済）"; 
    
    // 日付が一致したら送信
    if (dateStr === tomorrowDateStr) {
      try {
        GmailApp.sendEmail(email, '【Executive English】明日：カウンセリングのご確認',
          `${name} 様\n\n明日はカウンセリングの日程となっております。\n\n日時: ${timeStr}\nZoom URL: ${zoomUrl}\n\nお待ちしております。`
        );
      } catch (e) {
        console.error(`送信エラー: ${email}`, e);
      }
    }
  });
}

function doGet(e) {
  return ContentService.createTextOutput("GAS Web App is running!");
}
