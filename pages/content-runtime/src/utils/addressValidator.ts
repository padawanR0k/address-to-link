/**
 * 텍스트가 한국 주소인지 검증하는 함수
 * 한국 주소 패턴에 맞는지 확인 (행정구역, 도로명, 지번 등 포함)
 */
export function validateAddress(text: string): boolean {
  // 너무 짧은 텍스트는 주소가 아님 (최소 길이 설정)
  if (text.length < 7) {
    return false;
  }

  // 명확하게 주소가 아닌 패턴 (이메일, URL 등) 제외
  const nonAddressPattern = /^(https?:|www\.|@|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  if (nonAddressPattern.test(text)) {
    return false;
  }

  // 한국 행정구역 키워드 목록
  const administrationUnits = [
    '특별시',
    '광역시',
    '특별자치시',
    '특별자치도',
    '시',
    '군',
    '구',
    '읍',
    '면',
    '동',
    '리',
    '가',
    '로',
    '길',
    '번길',
  ];

  // 한국 행정구역 단위 단독 사용 패턴 (약한 조건)
  const weakPattern = new RegExp(`[가-힣]+(${administrationUnits.join('|')})\\b`);

  // 행정단위를 포함하지만 숫자가 없는 경우, 더 엄격한 검증 필요
  if (weakPattern.test(text) && !/\d/.test(text)) {
    // 단순히 '~~동', '~~면' 같은 단어가 포함된 문장은 제외
    // 예: "코딩을 공부하는 중입니다", "학생회관 근처에 있어요"
    if (
      text.length < 15 &&
      administrationUnits.some(unit => {
        const unitIndex = text.indexOf(unit);
        return unitIndex > 0 && unitIndex < text.length - unit.length - 3;
      })
    ) {
      return false;
    }

    // 주요 도시/지역명이 있는지 확인 (약한 조건에 대한 추가 검증)
    const majorRegions = [
      '서울',
      '부산',
      '대구',
      '인천',
      '광주',
      '대전',
      '울산',
      '세종',
      '경기',
      '강원',
      '충북',
      '충남',
      '전북',
      '전남',
      '경북',
      '경남',
      '제주',
    ];

    // 주요 지역명 + 행정단위 조합 확인
    const hasRegionWithUnit = majorRegions.some(
      region => text.includes(region) && administrationUnits.some(unit => text.includes(unit)),
    );

    if (!hasRegionWithUnit) {
      return false;
    }
  }

  // 강력한 한국 주소 패턴 (여러 가지 주소 유형 포함)
  const patterns = [
    // 1. 도로명 주소 패턴 (번호 포함): "XX로/길 123" 또는 "XX로/길 123번길"
    /[가-힣]+(로|길)\s*\d+(-\d+)?(\s*번지)?/,

    // 2. 지번 주소 패턴: "XX동/읍/면/리 123", "XX동 123-45"
    /[가-힣]+(동|읍|면|리)\s*\d+(-\d+)?(\s*번지)?/,

    // 3. 건물명, 아파트 등 패턴: "XX아파트", "XX빌딩" (보통 숫자도 함께 있음)
    /[가-힣]+(아파트|오피스텔|빌딩|타워)(\s*\d+동)?(\s*\d+호)?/,

    // 4. 시/군/구 + 번지 패턴: "XX시 YY구 123"
    /[가-힣]+(시|군|구)\s+[가-힣]+(동|읍|면|로|길)\s*\d+/,

    // 5. 상세 행정구역 패턴: "XX시 YY구 ZZ동"
    /[가-힣]+(시|도)\s+[가-힣]+(시|군|구)\s+[가-힣]+(동|읍|면|로|길|가)/,

    // 6. 우편번호 패턴: "우편번호 12345" 또는 "12345" (주소 문맥에서)
    /우편번호\s*\d{5}|\(\d{5}\)|\s\d{5}\s/,
  ];

  // 패턴 중 하나라도 일치하면 한국 주소로 인식
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // 숫자와 행정구역 단위가 모두 포함된 경우 (보다 약한 조건이지만 여전히 유효한 경우)
  const hasNumber = /\d+/.test(text);
  const hasMultipleAdminUnits = administrationUnits.filter(unit => text.includes(unit)).length >= 2;

  if (hasNumber && hasMultipleAdminUnits) {
    return true;
  }

  return false;
}
