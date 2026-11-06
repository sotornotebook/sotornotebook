import { useGLTF } from '@react-three/drei';
import { Suspense, useMemo } from 'react';

function Model({ url, ...props }: { url: string } & JSX.IntrinsicElements['group']) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={clone} {...props} />;
}

/** Renders a GLTF from /public/models (see src/data/models.ts). */
export function ModelSlot({ url, fallback = null, ...props }: { url: string; fallback?: React.ReactNode } & JSX.IntrinsicElements['group']) {
  return (
    <Suspense fallback={fallback}>
      <Model url={url} {...props} />
    </Suspense>
  );
}
