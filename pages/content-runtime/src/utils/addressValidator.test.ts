import { validateAddress } from './addressValidator';

describe('validateAddress', () => {
  it(`"넘게 왕십리를 지켜온" 같은 주소 단위가 1개인것은 유효하지 않다.`, () => {
    const result = validateAddress('넘게 왕십리를 지켜온');
    expect(result).toStrictEqual({
      valid: false,
      matched: null,
    });
  });

  it(`"서울특별시 강남구" 같은 유효한 주소는 유효하다.`, () => {
    const result = validateAddress('서울특별시 강남구');
    expect(result).toStrictEqual({
      valid: true,
      matched: '서울특별시 강남구',
    });
  });

  it(`"추천 BEST 5 · 너의작업실. 경기 고양시 일산동구 일산로380번길 63-36 · 하우워즈유얼데이." 라는 문구에서는
         "경기 고양시 일산동구 일산로380번길 63-36" 만 매칭되어야 한다.`, () => {
    const result = validateAddress(
      '추천 BEST 5 · 너의작업실. 경기 고양시 일산동구 일산로380번길 63-36 · 하우워즈유얼데이.',
    );

    expect(result).toStrictEqual({
      valid: true,
      matched: '경기 고양시 일산동구 일산로380번길 63-36',
    });
  });
});
