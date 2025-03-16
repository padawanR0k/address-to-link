/**
 * 텍스트가 한국 주소인지 검증하는 함수
 * 한국 주소 패턴에 맞는지 확인 (행정구역, 도로명, 지번 등 포함)
 * @returns {Object} {valid: boolean, matched: string | null}
 */
export function validateAddress(text: string): {
  valid: boolean;
  matched: string | null;
} {
  // 너무 짧은 텍스트는 주소가 아님 (최소 길이 설정)
  if (text.length < 7) {
    return { valid: false, matched: null };
  }

  // 명확하게 주소가 아닌 패턴 (이메일, URL 등) 제외
  const nonAddressPattern = /^(https?:|www\.|@|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  if (nonAddressPattern.test(text)) {
    return { valid: false, matched: null };
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

  // 주요 도시/지역명 목록
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

  // 주소 패턴 - 더 특정한 패턴부터 검사
  const strongPatterns = [
    // 1. 도로명 주소 패턴 (번호 포함): "XX로/길 123" 또는 "XX로/길 123번길"
    /([가-힣]+(로|길)\s*\d+(-\d+)?(\s*번지)?)/,

    // 2. 지번 주소 패턴: "XX동/읍/면/리 123", "XX동 123-45"
    /([가-힣]+(동|읍|면|리)\s*\d+(-\d+)?(\s*번지)?)/,

    // 3. 시/군/구 + 번지 패턴: "XX시 YY구 123"
    /([가-힣]+(시|군|구)\s+[가-힣]+(동|읍|면|로|길)\s*\d+)/,

    // 4. 상세 행정구역 패턴: "XX시 YY구 ZZ동"
    /([가-힣]+(시|도)\s+[가-힣]+(시|군|구)\s+[가-힣]+(동|읍|면|로|길|가))/,

    // 5. 간단한 행정구역 패턴 (두 단계 이상): "XX시 YY구", "서울특별시 강남구"
    new RegExp(
      `(${majorRegions.join('|')})[가-힣]*(${administrationUnits.join('|')})[\\s]*[가-힣]+(${administrationUnits.join('|')})`,
    ),
  ];

  // 중간 강도 패턴
  const mediumPatterns = [
    // 1. 건물명, 아파트 등 패턴: "XX아파트", "XX빌딩" (숫자 포함)
    /([가-힣]+\d+[가-힣]*(아파트|오피스텔|빌딩|타워)(\s*\d+동)?(\s*\d+호)?)/,

    // 2. 간단한 행정구역 패턴: "서울시 강남구"
    new RegExp(
      `(${majorRegions.join('|')})[가-힣]*(${administrationUnits.join('|')})[\\s]*[가-힣]+(${administrationUnits.join('|')})`,
    ),
  ];

  // 강력한 패턴 먼저 검사
  for (const pattern of strongPatterns) {
    const match = text.match(pattern);
    if (match) {
      const matchedText = match[1] || match[0];
      const matchIndex = text.indexOf(matchedText);
      const expandedMatch = extractFullAddress(text, matchIndex, matchedText);
      return { valid: true, matched: expandedMatch };
    }
  }

  // 중간 강도 패턴 검사
  for (const pattern of mediumPatterns) {
    const match = text.match(pattern);
    if (match) {
      const matchedText = match[1] || match[0];
      const matchIndex = text.indexOf(matchedText);
      const expandedMatch = extractFullAddress(text, matchIndex, matchedText);
      return { valid: true, matched: expandedMatch };
    }
  }

  // 약한 패턴 - 더 엄격하게 수정
  // 행정구역 단위가 있고, 주요 지역명도 포함하며, 숫자도 있는 경우만 유효하게 판단
  const hasAdminUnit = administrationUnits.some(unit => {
    // 행정 단위가 단어의 끝에 오는 경우만 고려 (예: "왕십리동"은 유효하나 "왕십리를" 같은 경우는 제외)
    const regex = new RegExp(`[가-힣]+${unit}\\b`);
    return regex.test(text);
  });

  const hasRegion = majorRegions.some(region => text.includes(region));
  const hasNumber = /\d+/.test(text);

  // 주요 지역명 + 행정단위 + 숫자가 모두 존재하는 경우만 주소로 판단
  if (hasAdminUnit && hasRegion && hasNumber) {
    // 주소 부분만 추출 시도
    const match = text.match(/[가-힣]+(시|도|군|구)[^가-힣]?[가-힣]+(동|읍|면|로|길)[^가-힣]?\d+/);
    if (match) {
      return {
        valid: true,
        matched: extractFullAddress(text, text.indexOf(match[0]), match[0]),
      };
    }

    // 간단한 행정단위 조합 (예: "서울특별시 강남구")
    const simpleMatch = text.match(
      new RegExp(
        `(${majorRegions.join('|')})[가-힣]*(${administrationUnits.join('|')})[\\s]*[가-힣]+(${administrationUnits.join('|')})`,
      ),
    );
    if (simpleMatch) {
      return {
        valid: true,
        matched: simpleMatch[0],
      };
    }
  }

  return { valid: false, matched: null };
}

/**
 * 텍스트에서 매치된 패턴을 중심으로 완전한 주소를 추출하는 함수
 * @param text 전체 텍스트
 * @param matchIndex 매치된 패턴의 시작 인덱스
 * @param matchedText 매치된 패턴 텍스트
 * @returns 확장된 주소 문자열
 */
function extractFullAddress(text: string, matchIndex: number, matchedText: string): string {
  // 구분자를 기준으로 추출 (더 많은 구분자 추가)
  const delimiters = ['·', '.', ',', ';', '\n', ':', '!', '?', '|'];

  // 매치된 부분 앞뒤의 문자열
  const beforeText = text.substring(0, matchIndex);
  const afterText = text.substring(matchIndex + matchedText.length);

  // 앞쪽 경계 찾기 - 가장 가까운 구분자 이후부터
  let startPos = 0;
  for (const delimiter of delimiters) {
    const lastDelimiterPos = beforeText.lastIndexOf(delimiter);
    if (lastDelimiterPos !== -1 && lastDelimiterPos > startPos) {
      startPos = lastDelimiterPos + 1;
    }
  }

  // 뒤쪽 경계 찾기 - 가장 가까운 구분자까지
  let endPos = text.length;
  for (const delimiter of delimiters) {
    const nextDelimiterPos = afterText.indexOf(delimiter);
    if (nextDelimiterPos !== -1) {
      const absolutePos = matchIndex + matchedText.length + nextDelimiterPos;
      if (absolutePos < endPos) {
        endPos = absolutePos;
      }
    }
  }

  // 추출된 주소 문자열 정리 (앞뒤 공백 제거)
  return text.substring(startPos, endPos).trim();
}
