import ContestCertificate from '../types/contestCertificate';

export const getTwitterMessage = (
  id: string,
  certificate: ContestCertificate,
  idx: number,
  isEnglish: boolean
) => {
  if (idx === 0) {
    if (isEnglish) {
      return `${certificate.handle} registered with Codeforces Anytime!
#CodeforcesAnytime
https://codeforces-anytime.sonoapp.page/users/${id}`;
    } else {
      return `${certificate.handle}さんがCodeforces Anytimeに登録しました!
#CodeforcesAnytime
https://codeforces-anytime.sonoapp.page/users/${id}`;
    }
  } else {
    if (isEnglish) {
      return `[VIRTUAL PARTICIPATION]
${certificate.handle} took ${certificate.rankString} place in ${
        certificate.contestName
      }!
Performance: ${certificate.performance}
Rating: ${certificate.oldRating} → ${certificate.newRating} (${
        certificate.deltaString
      })${
        certificate.isHighest
          ? `
Updated highest rating!`
          : ''
      }
#CodeforcesAnytime
https://codeforces-anytime.sonoapp.page/users/${id}?cert=${idx}&lang=en`;
    } else {
      return `[バーチャル参加]
${certificate.handle}さんの${
        certificate.contestName
      }での結果は${certificate.rankString.substr(
        0,
        certificate.rankString.length - 2
      )}位でした！
パフォーマンス：${certificate.performance}相当
レーティング：${certificate.oldRating}→${certificate.newRating} (${
        certificate.deltaString
      })${
        certificate.isHighest
          ? `
Highestを更新しました！`
          : ''
      }
#CodeforcesAnytime
https://codeforces-anytime.sonoapp.page/users/${id}?cert=${idx}`;
    }
  }
};
