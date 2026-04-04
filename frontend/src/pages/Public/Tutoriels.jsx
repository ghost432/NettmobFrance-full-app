import TutorielsPage from './TutorielsPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
export default function Tutoriels() {
    useDocumentTitle('Tutoriels');
    return <TutorielsPage type="auto-entrepreneur" />;
}
