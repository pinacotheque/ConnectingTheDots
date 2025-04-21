import {
  Container,
  Button,
  Form,
  InputGroup,
  Card,
  Badge,
  Col,
} from "react-bootstrap";
import "../styles/home.css";
import searchIcon from "../assets/search.svg";
import { mockSpaces } from "../data/mock";

export default function Home() {
  return (
    <Container className="home">
      <div className="col1">Tags</div>
      <div className="col2">
        <div className="search">
          <h4>Search Spaces</h4>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Spaces"
              aria-label="space"
              aria-describedby="basic-addon2"
            />
            <Button variant="outline-secondary" id="button-addon2">
              <img
                src={searchIcon}
                width="20"
                height="20"
                className="d-inline-block align-top"
                alt="React Bootstrap logo"
              />
            </Button>
          </InputGroup>
        </div>
        <div className="browse">
          {mockSpaces.map((space) => (
            <Col key={space.id} md={6} lg={12} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>{space.title}</Card.Title>
                  <Card.Text>{space.description}</Card.Text>
                  <div className="mb-3">
                    {space.tags.map((tag, i) => (
                      <Badge key={i} bg="secondary" className="me-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="primary">Join</Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </div>
      </div>
    </Container>
  );
}
