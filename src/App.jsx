import './styles.css';
import EmailPage from './pages/EmailPage';
import PromptPage from './pages/PromptPage';
import ImageReviewPage from './pages/ImageReviewPage';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<EmailPage />} />
      <Route path="/prompt" element={<PromptPage />} />
      <Route path="/review" element={<ImageReviewPage />} />
    </Routes>
  )
}

export default App
