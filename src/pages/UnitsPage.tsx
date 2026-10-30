import { Layout } from '../components/Layout';
import { UnitsOfMeasureTab } from '../components/units/UnitsOfMeasureTab';

export function UnitsPage() {
  return (
    <Layout>
      <div className="flex flex-col min-h-0">
        <UnitsOfMeasureTab />
      </div>
    </Layout>
  );
}
