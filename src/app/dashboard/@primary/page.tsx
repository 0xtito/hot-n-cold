import {
  CreateMatchButton,
  StartGameButton,
} from "@/components/client/dashboard/";

function PrimaryContent() {
  return (
    <div className="gapy-y-2 flex h-full w-full flex-grow flex-col items-center justify-around">
      <StartGameButton />
      <CreateMatchButton />
    </div>
  );
}

export default PrimaryContent;
