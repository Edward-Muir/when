import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useMemo } from 'react';
import App from '../App';
import { decodeChallengeCode } from '../utils/challengeCode';

export default function ChallengeRoute() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const challengeConfig = useMemo(() => (code ? decodeChallengeCode(code) : null), [code]);

  const handleNavigateHome = () => {
    navigate('/', { replace: true });
  };

  if (!challengeConfig) {
    return <Navigate to="/" replace />;
  }

  return (
    <App
      autoStartChallenge={challengeConfig}
      challengeCode={code!}
      onNavigateHome={handleNavigateHome}
    />
  );
}
