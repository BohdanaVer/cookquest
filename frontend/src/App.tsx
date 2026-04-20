import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<div className="p-10 text-2xl font-bold text-blue-500">CookQuest React працює!</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;