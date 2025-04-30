import './App.css';
import { Route, Routes} from 'react-router-dom';
import MainPage from './pages/MainPage';
import DiscussionPage from'./pages/DiscussionPage';
// import { useState } from 'react';

function App() {
  // const [discussionData, setDiscussionData] = useState({
  //   topic: '',
  //   personas: [],
  //   roles: { pro: [], con: [] },
  // });
  

  // return (
  //     <Routes>
  //       <Route path="/" element={<MainPage setDiscussionData={setDiscussionData}/>}/>
  //       <Route path="/discussion" element={<DiscussionPage discussionData={discussionData}/>}/>
  //     </Routes>
  // );
  return (
    <Routes>
      <Route path="/" element={<MainPage/>}/>
      <Route path="/discussion" element={<DiscussionPage/>}/>
    </Routes>
  );
}

export default App;
