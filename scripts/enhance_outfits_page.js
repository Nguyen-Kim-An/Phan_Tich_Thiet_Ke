const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/outfits/page.tsx', 'utf8');

// 1. Add Decart Client Imports
if (!code.includes('decart-client')) {
  code = code.replace(
    "import { Icon } from '@/components/icons';",
    `import { Icon } from '@/components/icons';
import {
  getDecartStatus,
  executeDecartTryOn,
  DecartRealtimeController,
  type DecartStatus,
} from '@/services/decart-client';`
  );
}

// 2. Add SAMPLE_MODELS constant before export default function
if (!code.includes('SAMPLE_MODELS')) {
  const sampleModelsCode = `
export const SAMPLE_MODELS = [
  {
    id: 'hourglass',
    name: 'Mẫu 01 (Đồng hồ cát)',
    badge: 'Tôn vòng eo',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=80',
  },
  {
    id: 'pear',
    name: 'Mẫu 02 (Dáng Quả lê)',
    badge: 'Cân đối bờ vai',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=720&q=80',
  },
  {
    id: 'rect',
    name: 'Mẫu 03 (Thanh mảnh)',
    badge: 'Phom suông hiện đại',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=720&q=80',
  },
  {
    id: 'smart',
    name: 'Mẫu 04 (Nam lịch lãm)',
    badge: 'Modern Tailored',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=720&q=80',
  },
];
`;
  code = code.replace(
    'export default function OutfitsPage() {',
    `${sampleModelsCode}\nexport default function OutfitsPage() {`
  );
}

// 3. Set default inBodyPhoto to SAMPLE_MODELS[0].photo & add Decart state
code = code.replace(
  "const [inBodyPhoto, setInBodyPhoto] = useState<string>(\r\n    ''\r\n  );",
  "const [inBodyPhoto, setInBodyPhoto] = useState<string>(SAMPLE_MODELS[0].photo);\r\n  const [decartStatus, setDecartStatus] = useState<DecartStatus | null>(null);\r\n  const [decartLiveMirror, setDecartLiveMirror] = useState(false);\r\n  const [decartLiveMessage, setDecartLiveMessage] = useState('');\r\n  const [decartModalOpen, setDecartModalOpen] = useState(false);\r\n  const decartRealtimeRef = useRef<DecartRealtimeController | null>(null);"
);
code = code.replace(
  "const [inBodyPhoto, setInBodyPhoto] = useState<string>(\n    ''\n  );",
  "const [inBodyPhoto, setInBodyPhoto] = useState<string>(SAMPLE_MODELS[0].photo);\n  const [decartStatus, setDecartStatus] = useState<DecartStatus | null>(null);\n  const [decartLiveMirror, setDecartLiveMirror] = useState(false);\n  const [decartLiveMessage, setDecartLiveMessage] = useState('');\n  const [decartModalOpen, setDecartModalOpen] = useState(false);\n  const decartRealtimeRef = useRef<DecartRealtimeController | null>(null);"
);

// 4. Add useEffect on mount to load Decart Status
if (!code.includes('getDecartStatus().then')) {
  code = code.replace(
    'useEffect(() => {',
    `useEffect(() => {
    getDecartStatus().then((st) => setDecartStatus(st)).catch(() => {});
  }, []);

  useEffect(() => {`
  );
}

// 5. In cleanup webcam stream, add decartRealtimeRef stop
code = code.replace(
  'voiceSessionRef.current?.stop();',
  'voiceSessionRef.current?.stop();\n      decartRealtimeRef.current?.disconnect();'
);

fs.writeFileSync('apps/web/src/app/outfits/page.tsx', code, 'utf8');
console.log('Phase 1 of OutfitsPage enhancement done.');

