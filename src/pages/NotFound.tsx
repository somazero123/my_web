import { Link } from "react-router-dom";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <PageShell>
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-sm text-zinc-600">页面不存在</div>
          <div className="mt-4">
            <Link to="/">
              <Button variant="secondary">返回首页</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

