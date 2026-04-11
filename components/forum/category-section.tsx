import { ForumList } from "./forum-list";

interface CategorySectionProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    forums: Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      iconUrl: string | null;
      postCount: number;
      todayPostCount: number;
      category: { slug: string };
    }>;
  };
}

export function CategorySection({ category }: CategorySectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">{category.name}</h2>
        {category.description && (
          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
        )}
      </div>
      <ForumList
        forums={category.forums.map((f) => ({
          ...f,
          category: { slug: category.slug },
        }))}
      />
    </section>
  );
}
