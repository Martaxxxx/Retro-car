import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "../axios";
import { useUser } from "../components/context/UserContext";

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

const SLIDES_PER_PAGE = 5;

const ProjectSlider: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const sliderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { user } = useUser();

  useEffect(() => {
    setProjects([]);
    setPage(1);
    setHasMore(true);

    if (user) {
      loadProjects(1, true);
    }
    // eslint-disable-next-line
  }, [user]);

  const loadProjects = async (pageToLoad: number, reset: boolean = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.get(`/projects?page=${pageToLoad}&per_page=${SLIDES_PER_PAGE}`);
      const newProjects = res.data.data || res.data;

      setProjects(prev => {
        if (reset) return newProjects;
        const ids = new Set(prev.map(p => p.id));
        return [...prev, ...newProjects.filter(np => !ids.has(np.id))];
      });
      setHasMore(!!res.data.next_page_url || (newProjects.length === SLIDES_PER_PAGE));
      setPage(pageToLoad);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (dir: "left" | "right") => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({
        left: dir === "left" ? -300 : 300,
        behavior: "smooth",
      });
      if (dir === "right") {
        const slider = sliderRef.current;
        setTimeout(() => {
          if (
            slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10 &&
            hasMore &&
            !loading
          ) {
            loadProjects(page + 1);
          }
        }, 350);
      }
    }
  };

  const handleClick = (id: string, name: string) => {
    const encodedName = encodeURIComponent(name);
    navigate(`/projectdetails/${id}/${encodedName}`);
  };

  if (!user) {
    return null;
  }

  return (
    <Container>
      <Header>Projekty w realizacji</Header>
      <SliderRow>
        <ArrowButton onClick={() => scroll("left")}>
          <ChevronLeft />
        </ArrowButton>
        <SliderWrapper ref={sliderRef}>
          {projects.map((project) => (
            <SlideCard key={project.id} onClick={() => handleClick(project.id, project.name)}>
              {project.image ? (
                <Image src={project.image} alt={project.name} />
              ) : (
                <PlaceholderBox />
              )}
              <Title>{project.name}</Title>
              <ProgressBar>
                {/* UŻYWAJ progressPercent z API! */}
                <Progress $progress={project.progressPercent ?? 0} />
              </ProgressBar>
              {/* Opcjonalnie, widoczna liczba procent */}
              <div style={{
                marginTop: 6,
                fontSize: "13px",
                color: "#9C2F3B",
                fontWeight: "bold"
              }}>
                {project.progressPercent ?? 0}%
              </div>
            </SlideCard>
          ))}
          {loading && (
            <SlideCard>
              <PlaceholderBox />
              <Title>Ładowanie...</Title>
              <ProgressBar>
                <Progress $progress={100} />
              </ProgressBar>
            </SlideCard>
          )}
        </SliderWrapper>
        <ArrowButton onClick={() => scroll("right")}>
          <ChevronRight />
        </ArrowButton>
      </SliderRow>
    </Container>
  );
};

export default ProjectSlider;