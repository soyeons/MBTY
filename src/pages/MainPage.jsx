import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled, keyframes } from 'styled-components';
import * as XLSX from 'xlsx';

// assets - MBTI 이미지
import isfj from '../assets/ISFJ.png';
import entj from '../assets/ENTJ.png';
import istp from '../assets/ISTP.png';
import estj from '../assets/ESTJ.png';
import enfp from '../assets/ENFP.png';
import infj from '../assets/INFJ.png';
import estp from '../assets/ESTP.png';
import enfj from '../assets/ENFJ.png';
import istj from '../assets/ISTJ.png';
import intj from '../assets/INTJ.png';
import intp from '../assets/INTP.png';
import infp from '../assets/INFP.png';
import esfp from '../assets/ESFP.png';
import esfj from '../assets/ESFJ.png';
import isfp from '../assets/ISFP.png';
import entp from '../assets/ENTP.png';

// assets - 페르소나 랜덤 물음표 카드 이미지
import card from '../assets/물음표카드.png';

// MBTI 맵
const allPersonasMap = {
  ISFJ: isfj,
  ENTJ: entj,
  ISTP: istp,
  ESTJ: estj,
  ENFP: enfp,
  INFJ: infj,
  ESTP: estp,
  ENFJ: enfj,
  ISTJ: istj,
  INTJ: intj,
  INTP: intp,
  INFP: infp,
  ESFP: esfp,
  ESFJ: esfj,
  ISFP: isfp,
  ENTP: entp
};

function MainPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('topic'); // 'topic' : 초기 상태. 주제만 노출 / 'button' : 참가자 확인하기 버튼 노출 / 'cards' : 카드 좌우 흔들리는 애니메이션 / 'reveal' : MBTI 3개 노출
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState([]);
  const [roles, setRoles] = useState({ pro: [], con: [] });
  const [userStance, setUserStance] = useState(null);

  // 토론 주제 엑셀 파일 로드
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/토론 주제.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        const topicList = json.map(row => Object.values(row)[1]);
        setTopics(topicList);

        // 최초 주제 선정
        const rnd = Math.floor(Math.random() * topicList.length);
        setSelectedTopic(topicList[rnd]);
      } catch (err) {
        console.error('토론 주제 로드 실패:', err);
      }
    };
    fetchTopics();
  }, []);

  // '참가자 확인하기' 버튼 노출 타임
  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('selectStance');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // '찬반 고르기' 버튼
  const handleStanceClick = (stance) => {
    setUserStance(stance);
    setStage('button');
  };

  // '참가자 확인하기' 버튼
  const handleButtonClick = () => {
    setStage('cards');

    // MBTI 3개 랜덤 선택
    const types = Object.keys(allPersonasMap);
    const shuffledTypes = [...types].sort(() => 0.5 - Math.random());
    const selected = shuffledTypes.slice(0, 3);
    setSelectedPersonas(selected);

    // 찬반 역할 분배(MBTI 3개랑 user -> 찬2, 반2)
    const participants = [...selected];
    const shuffledParts = [...participants].sort(() => 0.5 - Math.random()); // 무작위 랜덤으로 섞고
    // const pro = shuffledParts.slice(0, 2); // 앞 두 명: 찬성
    // const con = shuffledParts.slice(2, 4); // 뒤 두 명: 반대
    // const pro = userStance === '찬성' ? ["User", shuffledParts[0]] : [shuffledParts[0], shuffledParts[1]];
    // const con = userStance === '반대' ? ["User", shuffledParts[0]] : [shuffledParts[2], shuffledParts[3]];
    let pro = [];
    let con = [];

    if (userStance === '찬성') {
      pro = ['User', shuffledParts[0]];
      con = [shuffledParts[1], shuffledParts[2]];
    } else {
      con = ['User', shuffledParts[0]];
      pro = [shuffledParts[1], shuffledParts[2]];
    }

    setRoles({ pro, con });

    // 카드 노출 타임
    setTimeout(() => setStage('reveal'), 3000);
  };

  // const handleStartDiscussion = () => {
  //   navigate('/discussion');
  // };

    return (
        <Container>
            <ContentWrapper>
              <TopicText moveUp={stage !== 'topic'}>
                🚀 오늘의 토론 주제는 <strong>“{selectedTopic}”</strong> 입니다. 🚀
              </TopicText>

              {(stage === 'cards' || stage === 'reveal') && userStance && (
                <UserStanceText>
                  🙋 당신은 <strong style={{ color: userStance === '찬성' ? '#4caf50' : '#f44336' }}>{userStance}</strong> 입장입니다.
                </UserStanceText>
              )}

              {stage === 'selectStance' && (
                <FadeInWrapper>
                  <StanceText>🚩 어떤 입장에서 토론에 참여하시겠어요?</StanceText>
                  <StanceButtonWrapper>
                    <StanceButton stance="찬성" onClick={() => handleStanceClick('찬성')}>찬성</StanceButton>
                    <StanceButton stance="반대" onClick={() => handleStanceClick('반대')}>반대</StanceButton>
                  </StanceButtonWrapper>
                </FadeInWrapper>
              )}
              {stage === 'button' && (
                <FadeInWrapper>
                  <Button onClick={handleButtonClick}>다른 참가자 확인하기</Button>
                </FadeInWrapper>
              )}

              {(stage === 'cards' || stage === 'reveal') && (
                <>
                    <CardContainer stage={stage}>
                      {[...Array(7)].map((_, i) => (
                        <CardWrapper key={i}>
                          <Card
                            className={
                              stage === 'reveal' && i >= 2 && i <= 4 ? 'center flip' : ''
                            }
                          >
                            {stage === 'reveal' && i >= 2 && i <= 4 ? (
                              <img src={allPersonasMap[selectedPersonas[i - 2]]} alt={selectedPersonas[i - 2]} />
                            ) : (
                              <img src={card} alt="Back of card" />
                            )}
                          </Card>
                          {stage === 'reveal' && i >= 2 && i <= 4 && (
                            <>
                              <MBTILabel>{selectedPersonas[i - 2]}</MBTILabel>
                              <RoleLabel stance={
                                            roles.pro.includes(selectedPersonas[i - 2])
                                              ? '찬성'
                                              : roles.con.includes(selectedPersonas[i - 2])
                                              ? '반대'
                                              : ''
                              }>
                                {roles.pro.includes(selectedPersonas[i - 2])
                                  ? '찬성'
                                  : roles.con.includes(selectedPersonas[i - 2])
                                  ? '반대'
                                  : ''}
                              </RoleLabel>
                            </>
                          )}
                        </CardWrapper>
                      ))}
                    </CardContainer>

                  {stage === 'reveal' && (
                    <FadeInWrapper>
                      {/* <Button onClick={handleStartDiscussion}>
                        토론 참여하기
                      </Button> */}
                      <Button
                        onClick={() =>
                          navigate('/discussion', {
                            state: { topic: selectedTopic, personas: selectedPersonas, roles },
                          })
                        }
                      >
                        토론 참여하기
                      </Button>
                    </FadeInWrapper>
                  )}
                </>
              )}
            </ContentWrapper>
        </Container>
    );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fdfdfd;
  overflow-x: hidden;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const slideUp = keyframes`
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-100px); opacity: 1; }
`;

const TopicText = styled.div`
  font-size: 50px;
  font-weight: 800;
  margin-bottom: 20px;
  text-align: center;
  animation: ${({ moveUp }) => (moveUp ? slideUp : 'none')} 1s forwards;
`;

const FadeInWrapper = styled.div`
  animation: fadeIn 1s ease-in-out forwards;
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const StanceButtonWrapper = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 20px;
`;


const slideCards = keyframes`
  0% { transform: translateX(0); }
  10% { transform: translateX(-40px); }
  20% { transform: translateX(40px); }
  30% { transform: translateX(-35px); }
  40% { transform: translateX(35px); }
  50% { transform: translateX(-25px); }
  60% { transform: translateX(25px); }
  70% { transform: translateX(-15px); }
  80% { transform: translateX(15px); }
  90% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

const CardContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 60px;
  animation: ${({ stage }) => stage === 'cards' && slideCards} 2s ease-out;
`;

const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Card = styled.div`
  width: 200px;
  height: 300px;
  background-color: white;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 1s;
  transform-style: preserve-3d;

  &.center {
    transform: translateY(0);
  }

  &.flip {
    transform: rotateY(180deg);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MBTILabel = styled.div`
  margin-top: 10px;
  font-size: 40px;
  font-weight: bold;
  color: #333;
`;

const UserStanceText = styled.div`
  font-size: 40px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
`;

const RoleLabel = styled.div`
  margin-top: 4px;
  font-size: 25px;
  font-weight: 800;
  color: ${({ stance }) =>
    stance === '찬성' ? '#4caf50' :
    stance === '반대' ? '#f44336' : '#666'};
`;

const Button = styled.button`
  margin-top: 60px;
  padding: 20px 40px;
  font-size: 30px;
  font-weight: bold;
  background-color: #6c63ff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;

  &:hover {
    background-color: #5548c8;
  }
`;

const StanceText = styled.div`
  font-size: 40px;
  margin-bottom: 30px;
  font-weight: 600;
  text-align: center;
  //background-color: yellow;
`;


const StanceButton = styled.button`
  margin: 10px;
  padding: 16px 32px;
  font-size: 25px;
  font-weight: 500;
  background-color: ${({stance}) => stance === '찬성' ? '#4caf50' : stance === '반대' ? '#f44336' : '#6c63ff'};
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  &:hover {
    background-color: ${({ stance }) =>
      stance === '찬성' ? '#3e8e41' : stance === '반대' ? '#d32f2f' : '#5548c8'};
  }
`;

export default MainPage;