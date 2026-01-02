import { Header } from "@/components/Header";
import { MockupEditor } from "@/components/MockupEditor";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <MockupEditor />
    </div>
  );
};

export default Index;