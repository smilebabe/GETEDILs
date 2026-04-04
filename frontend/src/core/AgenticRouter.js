import { useNavigate } from 'react-router-dom';

export const useAgenticRouter = () => {
  const navigate = useNavigate();

  const routeTo = (path) => {
    navigate(path);
  };

  return { routeTo };
};
