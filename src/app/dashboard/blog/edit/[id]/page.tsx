import ArticleForm from "@/components/blog/ArticleForm";

interface EditArticlePageProps {
    params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
    const { id } = await params;

    return (
        <div className="p-6 animate-in fade-in-50 duration-500">
            <ArticleForm articleId={id} />
        </div>
    );
}
