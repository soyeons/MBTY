import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled, keyframes } from 'styled-components';

import isfj from '../assets/ISFJ.png';
import entj from '../assets/ENTJ.png';
import istp from '../assets/ISTP.png';
import estj from '../assets/ESTJ.png';
import enfp from '../assets/ENFP.jpg';
import infj from '../assets/INFJ.jpg';
import estp from '../assets/ESTP.png';
import enfj from '../assets/ENFJ.png';
import istj from '../assets/ISTJ.png';
import intj from '../assets/INTJ.png';
import intp from '../assets/INTP.png';
import infp from '../assets/INFP.jpg';
import esfp from '../assets/ESFP.jpg';
import esfj from '../assets/ESFJ.png';
import isfp from '../assets/ISFP.png';
import card from '../assets/물음표카드.png';

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
};

function MainPage(props) {
  const navigate = useNavigate();
  const [stage, setStage] = useState('topic');
  const [selectedPersonas, setSelectedPersonas] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('button');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleButtonClick = () => {
    setStage('cards');

    const types = Object.keys(allPersonasMap);
    const shuffled = types.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    setSelectedPersonas(selected);

    setTimeout(() => setStage('reveal'), 3000);
  };
  

    return (
        <Container>
            <ContentWrapper>
              <TopicText moveUp={stage !== 'topic'}>
                오늘의 토론 주제는 <strong>“인공지능 기술이 인간을 대체할 수 있을까?”</strong> 입니다.
              </TopicText>

              {stage === 'button' && (
                <FadeInWrapper>
                  <Button onClick={handleButtonClick}>참가자 확인하기</Button>
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
                            <MBTILabel>{selectedPersonas[i - 2]}</MBTILabel>
                          )}
                        </CardWrapper>
                      ))}
                    </CardContainer>

                  {stage === 'reveal' && (
                    <FadeInWrapper>
                      <Button onClick={() => navigate("/discussion")}>토론 참여하기</Button>
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

// const CardScrollArea = styled.div`
//   width: 100vw;
//   overflow: hidden;
//   display: flex;
//   justify-content: center;
// `;

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

export default MainPage;