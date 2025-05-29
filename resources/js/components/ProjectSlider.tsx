
import React, { useRef } from "react";
import styled from "styled-components";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProjectData } from "../pages/projectData";
import { projectMap } from "../pages/projectData";


const Container = styled.div`
  padding: 40px 20px;
  background: #f8f8f8;
`;

const Header = styled.h2`
  font-size: 24px;
  margin-bottom: 24px;
  color: #222;
  text-align: left;
  margin-left: 12px;
`;

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
`;

const ArrowButton = styled.button`
  background: none;
  border: none;
  color: #9C2F3B;
  cursor: pointer;
  transition: transform 0.2s;
  padding: 4px;

  &:hover {
    transform: scale(1.2);
  }
`;

const SliderWrapper = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 20px;
  scroll-behavior: smooth;
  padding-bottom: 10px;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 6px;
  }
`;

const SlideCard = styled.div`
  flex: 0 0 auto;
  width: 260px;
  min-height: 340px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
`;

const Image = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 16px;
`;

const PlaceholderBox = styled.div`
  width: 100%;
  height: 200px;
  border-radius: 12px;
  background: repeating-linear-gradient(
    45deg,
    #f0f0f0,
    #f0f0f0 10px,
    #e0e0e0 10px,
    #e0e0e0 20px
  );
  margin-bottom: 16px;
`;

const Title = styled.h4`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
`;

const ProgressBar = styled.div`
  background: #eee;
  border-radius: 8px;
  height: 10px;
  overflow: hidden;
`;

const Progress = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${({ $progress }) => $progress}%;
  background: #9C2F3B;
  transition: width 0.3s;
`;

interface Props {
    projects: ProjectData[];
}

const ProjectSlider: React.FC<Props> = ({ projects }) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const scroll = (dir: "left" | "right") => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({
                left: dir === "left" ? -300 : 300,
                behavior: "smooth",
            });
        }
    };

    const handleClick = (id: string) => {
        navigate(`/projectdetails/${id}`);
    };

    return (
        <Container>
            <Header>Projekty w realizacji</Header>
            <SliderRow>
                <ArrowButton onClick={() => scroll("left")}> <ChevronLeft /> </ArrowButton>
                <SliderWrapper ref={sliderRef}>
                    {projects.map((project) => (
                        <SlideCard key={project.id} onClick={() => handleClick(project.id)}>
                            {project.image ? <Image src={project.image} alt={project.name} /> : <PlaceholderBox />}
                            <Title>{project.name}</Title>
                            <ProgressBar>
                                <Progress $progress={Math.floor(Math.random() * 60) + 30} />
                            </ProgressBar>
                        </SlideCard>
                    ))}
                </SliderWrapper>
                <ArrowButton onClick={() => scroll("right")}> <ChevronRight /> </ArrowButton>
            </SliderRow>
        </Container>
    );
};

export default ProjectSlider;
