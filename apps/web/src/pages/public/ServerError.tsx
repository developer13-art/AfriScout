import { Container } from "../../components/layout/Container";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/Button";
import { SeoHead } from "../../components/common/SeoHead";
import { useNavigate } from "react-router-dom";

export function ServerError() {
  const navigate = useNavigate();

  return (
    <>
      <SeoHead title="Something went wrong" />
      <Container className="py-10">
        <ErrorState
          title="Something went wrong"
          description="The server reported an error. Try again in a moment."
          action={<Button onClick={() => navigate("/")}>Back to home</Button>}
        />
      </Container>
    </>
  );
}