# Clamp CSS 생성기 🌊

최신 **Tailwind CSS V4**와 완벽하게 호환되는 반응형 폰트 사이즈(유동적 타이포그래피)를 위한 CSS `clamp()` 함수 코드를 생성해 주는 직관적인 계산기 웹 애플리케이션입니다. Next.js App Router 기반으로 제작되었습니다.

## Features ✨

- **반응형 폰트 사이즈 계산**: 기본(BASE) 구간부터 여러 브레이크포인트(단계 구분)까지 해상도별 목표 폰트 크기를 설정하여 부드럽게 크기가 변하는 `clamp()` 수식을 자동 생성합니다.
- **Toss(토스) 스타일 UI**:
  - 신뢰감 있고 깔끔한 '토스'의 디자인 시스템(흰색 배경, 파란색 포인트 컬러, 뚜렷한 글자 강약 조절)을 차용하여 극대화된 가독성 제공.
  - 여백(Margin/Padding)을 넓게 사용하여 클릭과 입력이 편안한 사용자 경험(UX) 제공.
  - 완벽한 한글화 지원.
- **다중 브레이크포인트 지원**: 가로 스크롤 가능한 구간 추가 카드를 통해 원하는 만큼 브레이크포인트를 생성 및 삭제 가능.
- **Tailwind V4 호환 출력**: 복잡한 설정 필요 없이 바로 프로젝트의 CSS 파일에 붙여 넣을 수 있는 최신 `@utility` 기반의 CSS Variable 형식 출력.
- **원클릭 복사 기능**: 계산된 CSS 코드를 클릭 한 번으로 클립보드에 복사할 수 있는 알림 스낵바 기능.

## Getting Started 🚀

의존성을 설치하고 로컬 서버를 실행합니다:

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 로 접속하여 결과를 확인합니다.

## Tech Stack 🛠

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS V4
- **Language**: TypeScript & React
