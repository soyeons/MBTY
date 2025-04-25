import './App.css';
import { Route, Routes} from 'react-router-dom';
import MainPage from './pages/MainPage';
import DiscussionPage from'./pages/DiscussionPage';

function App() {
  return (
      <Routes>
        <Route path="/" element={<MainPage/>}/>
        <Route path="/discussion" element={<DiscussionPage/>}/>
      </Routes>
  );
}

export default App;
