# SkillDeck — 직무 역량 면접 스마트 해금 학습 서비스

SkillDeck은 다양한 전공 및 직업 분야(사무/행정, 기계, 전기, 전자, ICT/SW, 화학)의 면접에 자주 등장하는 핵심 지식을 정리하고, **모의 면접 테스트를 통해 학습 카드를 발견(해금)하고 숙달하는 성장형** 웹 기반 **직무 역량 면접 대비 서비스**입니다.

## 🔗 배포 링크 (Vercel)
> **[SkillDeck Live Deployment URL](https://skilldecklearninterview.vercel.app/)**

---

## 🌟 주요 기능 (Core Features)

1. **다이내믹 직무 테마 스위칭 (Theme Customization)**
   - 대시보드 상단에서 직무(사무/행정, 기계, 전기, 전자, ICT/SW, 화학)를 전환할 때마다 배경 그래디언트와 메인 포인트 컬러가 유동적으로 변하여 뛰어난 시각적 만족감을 제공합니다.

2. **성장형 질문 발견 루프 (Gamified Discovery Loop)**
   - 처음에는 학습 카드가 0개인 상태로 시작합니다. **[모의 면접]** 탭에서 테스트를 치를 때마다 새로운 질문 카드들이 **[학습된 카드]** 도감에 실시간으로 해금되어 쌓이게 됩니다.
   - 답안을 미리 스포일러당하지 않고 실제 면접 현장과 같은 팽팽한 긴장감 속에서 질문을 처음 접할 수 있습니다.

3. **3D 플래시 카드 학습 (Flashcard Study Deck)**
   - 카드 클릭 시 CSS 3D Transform 효과로 카드가 뒤집히며 모범 해답과 해설이 표시됩니다.
   - 각 질문에 대해 `😀 암기됨(Mastered)`, `😐 가물함(Reviewing)`, `😰 모르겠음(Weak)`의 3단계 자가 평가 피드백을 부여해 개인 학습 진도를 저장합니다.

4. **100% 퍼센트 기반 학습 성숙도 트래킹 (Hidden absolute numbers)**
   - 대시보드에서는 카드의 전체 절대 개수를 밝히지 않고, 각 분야(전공 6종 및 공통 분야 1종)별로 오직 **질문 발견율(%)**과 발견된 카드 대비 **숙달율(%)**만으로 직무 준비도를 시각화합니다. 공통 분야와 전공 분야의 진척도는 철저히 분리되어 트래킹되어 데이터가 겹치거나 상호 간섭하지 않습니다.

5. **공통 질문 무작위 삽입 (Randomized Common Questions)**
   - 6대 직무 전공 외에 10가지의 인성/가치관/협업 관련 **'공통 질문'** 데이터셋이 추가되어 모의 시험 시 **4개의 직무 질문과 1개의 공통 질문**이 무작위 결합됩니다. 단, 공통 분야는 단독 모의시험을 진행할 수 없으며 대시보드 진행률 및 학습된 카드 도감에서만 개별 분리 조회가 가능합니다.

6. **나만의 커스텀 카드 추가 (Custom Card Builder)**
   - 기존 제공 질문 외에도 사용자가 직접 면접 기출이나 중요한 이론을 입력하여 새로운 학습 카드로 동적 추가할 수 있습니다. 추가된 카드는 자동으로 발견됨 상태가 되며 `localStorage`에 자동 보관됩니다.

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: Vanilla HTML5, Modern CSS3 (CSS Grid, Flexbox, 3D CSS animations, CSS Custom Variables), Vanilla ES6+ Javascript
- **Storage**: Browser `localStorage` (서버리스 클라이언트 단독 구동형)
- **Deployment**: Vercel

---

## 📂 파일 구조 (File Structure)

```text
Assi4/
├── index.html       # 메인 레이아웃 및 뷰 구조 정의 (사이드바 메뉴 및 모달 폼)
├── style.css        # 다이내믹 테마 변수 및 글래스모피즘 디자인 스타일시트
├── dataset.js       # 6개 직무 카테고리(60개) + 공통 카테고리(10개) 총 70개 질문 DB
├── app.js           # 상태 관리, 로컬 저장소 동기화, 라우팅 및 퀴즈 타이머 로직
└── README.md        # 서비스 설명서 및 실행 가이드
```

---

## 🚀 로컬 실행 방법 (How to Run Locally)

SkillDeck은 서버나 빌드 도구가 없는 순수 웹 프로젝트이므로 별도의 설치 과정 없이 즉시 실행할 수 있습니다.

### 방법 1: 브라우저로 직접 실행
1. 이 저장소(Repository)를 클론(Clone)하거나 폴더를 다운로드합니다.
2. `index.html` 파일을 더블클릭하여 사용하는 웹 브라우저(Chrome, Edge, Safari 등)에서 즉시 구동합니다.

### 방법 2: VS Code Live Server 이용 (권장)
1. VS Code에서 `Assi4` 폴더를 엽니다.
2. `Live Server` 확장을 설치한 뒤, 우측 하단의 `Go Live` 버튼을 클릭하여 로컬 호스트(`http://127.0.0.1:5500`) 환경에서 실행합니다.
