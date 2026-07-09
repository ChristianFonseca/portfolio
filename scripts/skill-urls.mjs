// URLs oficiales de las skills conocidas (mismas en EN/ES). Las que no estén
// aquí quedan con url:"" (no clickeables) y el usuario puede completarlas en el admin.
export const SKILL_URLS = {
  LangChain: "https://www.langchain.com",
  LangGraph: "https://langchain-ai.github.io/langgraph/",
  "Google ADK": "https://google.github.io/adk-docs/",
  Pinecone: "https://www.pinecone.io",
  FAISS: "https://faiss.ai",
  Ollama: "https://ollama.com",
  "Hugging Face": "https://huggingface.co",
  OpenAI: "https://openai.com",
  Gemini: "https://deepmind.google/technologies/gemini/",
  Anthropic: "https://www.anthropic.com",
  Bedrock: "https://aws.amazon.com/bedrock/",
  DeepSeek: "https://www.deepseek.com",
  xAI: "https://x.ai",
  TensorFlow: "https://www.tensorflow.org",
  PyTorch: "https://pytorch.org",
  "Scikit-learn": "https://scikit-learn.org",
  MLflow: "https://mlflow.org",
  "Vertex AI": "https://cloud.google.com/vertex-ai",
  "Amazon SageMaker": "https://aws.amazon.com/sagemaker/",
  PySpark: "https://spark.apache.org/docs/latest/api/python/",
  Databricks: "https://www.databricks.com",
  PostgreSQL: "https://www.postgresql.org",
  Oracle: "https://www.oracle.com/database/",
  Redshift: "https://aws.amazon.com/redshift/",
  "SQL Server": "https://www.microsoft.com/sql-server",
  MongoDB: "https://www.mongodb.com",
  "RDS/Aurora": "https://aws.amazon.com/rds/aurora/",
  Python: "https://www.python.org",
  TypeScript: "https://www.typescriptlang.org",
  R: "https://www.r-project.org",
  MATLAB: "https://www.mathworks.com/products/matlab.html",
  "C/C++": "https://isocpp.org",
  "C#": "https://learn.microsoft.com/dotnet/csharp/",
  Rust: "https://www.rust-lang.org",
  React: "https://react.dev",
  "Next.js": "https://nextjs.org",
  FastAPI: "https://fastapi.tiangolo.com",
  AWS: "https://aws.amazon.com",
  Azure: "https://azure.microsoft.com",
  GCP: "https://cloud.google.com",
  OCI: "https://www.oracle.com/cloud/",
  Docker: "https://www.docker.com",
  Kubernetes: "https://kubernetes.io",
  Git: "https://git-scm.com",
  "CI/CD (GitHub/GitLab/Bitbucket)": "https://github.com/features/actions",
  Terraform: "https://www.terraform.io",
  CloudFormation: "https://aws.amazon.com/cloudformation/",
}

// Convierte un array de badges (strings legacy o {name,url}) a {name,url},
// rellenando la URL desde el mapa si el badge no tiene una ya.
export function withUrls(badges) {
  return (badges ?? []).map((b) => {
    const name = typeof b === "string" ? b : b.name
    const existing = typeof b === "string" ? "" : b.url || ""
    return { name, url: existing || SKILL_URLS[name] || "" }
  })
}
