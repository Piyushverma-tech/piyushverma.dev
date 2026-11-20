import { Container } from "@/components/layout/container";
import { ProjectRow } from "@/components/home/project-row";
import { WorkSwitcher } from "@/components/home/work-switcher";
import { projectsByDiscipline, type Discipline } from "@/content/projects";

function List({ discipline }: { discipline: Discipline }) {
  return (
    <ul className="flex flex-col gap-20 sm:gap-24">
      {projectsByDiscipline(discipline).map((project) => (
        <li key={project.slug}>
          <ProjectRow project={project} />
        </li>
      ))}
    </ul>
  );
}

export function SelectedWork() {
  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="scroll-mt-20 py-24 sm:py-32"
    >
      <Container>
        <WorkSwitcher
          development={<List discipline="development" />}
          design={<List discipline="design" />}
        />
      </Container>
    </section>
  );
}
