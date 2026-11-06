import { lazy, Suspense, useEffect } from 'react';
import { useStore, useT } from './store/useStore';
import { Header } from './ui/Header';
import { Landing } from './ui/Landing';
import { Controls, A11yNav } from './ui/Controls';
import { Cart } from './ui/Cart';
import { WorkshopDialog } from './ui/SignupForm';
import { Fallback2D } from './ui/Fallback2D';
import { SceneDirector, Transition, useRoute } from './ui/SceneDirector';
import { ShopDrawer } from './ui/ShopDrawer';
import { ProductDetail } from './ui/ProductDetail';

// three.js & friends are only downloaded when the 3D alley is actually shown
const Experience = lazy(() => import('./scene/Experience'));

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const WEBGL = hasWebGL();
// Pick the initial view before the first render so the 3D bundle isn't fetched needlessly.
// ?view=2d / ?view=3d overrides the automatic choice.
{
  const forced = new URLSearchParams(location.search).get('view');
  const view = forced === '2d' || (forced !== '3d' && prefersReducedMotion()) || !WEBGL ? '2d' : '3d';
  useStore.setState({ view });
}

function Loading() {
  const t = useT();
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-navy font-display text-2xl text-glow" role="status">
      🏮 {t.loading}
    </div>
  );
}

export default function App() {
  const lang = useStore((s) => s.lang);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const scene = useStore((s) => s.scene);
  const sceneCategory = useStore((s) => s.sceneCategory);
  const { categoryId, productId } = useRoute();

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    document.body.classList.toggle('alley-3d', view === '3d');
  }, [view]);

  if (view === '2d') {
    return (
      <>
        <SceneDirector />
        <Fallback2D canUse3D={WEBGL} onView3D={() => setView('3d')} categoryId={categoryId} />
        {productId && <ProductDetail productId={productId} />}
        <Cart />
      </>
    );
  }

  const inside = scene === 'interior' && sceneCategory;
  return (
    <>
      <SceneDirector />
      <A11yNav />
      <Suspense fallback={<Loading />}>
        <Experience />
      </Suspense>
      <Header onView2D={() => setView('2d')} />
      {!inside && <Landing />}
      <Controls />
      {inside && <ShopDrawer categoryId={sceneCategory} />}
      {productId && <ProductDetail productId={productId} />}
      <WorkshopDialog />
      <Transition />
      <Cart />
    </>
  );
}
