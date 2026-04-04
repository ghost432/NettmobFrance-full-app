import TutorielsPage from './TutorielsPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
export default function TutorielsEntreprise() {
    useDocumentTitle('Tutoriels Entreprise');
    return <TutorielsPage type="enterprise" />;
}
