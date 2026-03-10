# Fluid Clamp Calculator 🫧

Utopia 스타일의 반응형 폰트 사이즈를 위한 CSS `clamp()` 함수 코드를 생성해 주는 계산기 패키지입니다. Next.js App Router로 개발되었습니다.

## Features ✨

- **단일 Clamp 계산기 모드**: 최소/최대 구간 사이즈를 입력하여 단일 속성 계산 (이전 버전 참고)
- **CSS 제너레이터**:
  - 기준 폰트, 최소/최대 너비 적용
  - 기본 사이즈와 스케일(Scale Ratio) 값을 곱해 각 단계(Step)별 사이즈 자동 산출
  - 양수/음수 단계(Steps)를 한꺼번에 CSS Variables 블럭 형태로 추출
  - 원클릭 복사 기능 (클립보드 스낵바 지원)
- **3D Cute UI**: 몽글몽글한 입체 그림자와 인터랙티브 버튼 디자인 지원

## Getting Started 🚀

의존성을 설치하고 로컬 서버를 실행합니다:

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 로 접속하여 결과를 확인합니다.

## Deployment

Vercel을 통해 배포될 예정입니다.
