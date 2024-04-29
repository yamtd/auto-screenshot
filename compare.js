import { exec } from "child_process";

// コマンドライン引数からパスを取得
const actualPath = process.argv[2];
const expectedPath = process.argv[3];
const diffPath = process.argv[4];
const reportPath = process.argv[5];

// reg-cli コマンドを構築
const command = `reg-cli ${actualPath} ${expectedPath} ${diffPath} -R ${reportPath}`;

console.log(`実行するコマンド: ${command}`);

// コマンドを実行
exec(command, (error, stdout, stderr) => {
  if (error.code == 1) {  // 終了コード1 差分が見つかった場合に発生するらしい
    console.log("エラーコード:1...生成されたファイルで差分を確認してください。");
    return;
  }
  if (error) {
    console.error(`実行エラー: ${error}`);
    console.error(`エラーの全情報:`, error);
    console.error(`エラーの詳細: ${stderr}`);
    return;
  }
  if (stdout) {
    console.log(`標準出力: ${stdout}`);
  }
});
