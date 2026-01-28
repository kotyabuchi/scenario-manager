/**
 * Discord名からユーザー名候補を生成する
 * - 英数字とアンダースコア以外をアンダースコアに置換
 * - 連続するアンダースコアを1つに圧縮
 * - 20文字に切り詰め、3文字未満ならパディング
 * - 空文字の場合はデフォルト値を返す
 */
export const generateUserName = (discordName: string): string => {
  if (discordName === '') {
    return 'user_00';
  }

  let name = discordName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_{2,}/g, '_');

  if (name.length > 20) {
    name = name.slice(0, 20);
  }

  while (name.length < 3) {
    name += '_';
  }

  return name;
};
