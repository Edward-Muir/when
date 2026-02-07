import { useNavigate } from 'react-router-dom';
import App from '../App';

export default function DailyRoute() {
  const navigate = useNavigate();

  const handleNavigateHome = () => {
    navigate('/', { replace: true });
  };

  return <App autoStartDaily onNavigateHome={handleNavigateHome} />;
}
