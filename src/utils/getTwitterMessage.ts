import ContestCertificate from '../types/contestCertificate';

export const getTwitterMessage = (
  id: string,
  certificate: ContestCertificate,
  idx: number
) => {
  if (idx === 0) {
    return `${certificate.handle} registered with Codeforces Anytime!
#CodeforcesAnytime
https://codeforces-anytime.sonoapp.page/users/${id}`;
  } else {
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
https://codeforces-anytime.sonoapp.page/users/${id}?cert=${idx}`;
  }
};
