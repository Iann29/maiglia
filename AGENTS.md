# Estamos desenvolvendo o SAAS chamado "MAIGLIA"

- Maiglia vai ser um SaaS de produtividade pessoal que oferece planilhas pré-construídas organizadas em blocos dentro de um canvas interativo. Os usuários podem arrastar, redimensionar e editar blocos de planilhas para criar seu próprio sistema de organização — seja para finanças, hábitos, metas, projetos ou rotina. O foco é eliminar a fricção de criar planilhas do zero, entregando templates prontos que funcionam de forma visual e integrada.

- Sempre que acabar de implementar algo, sugira uma mensagem para o commit.

# Sistema criado para ajudar a ver arquivos e encontrar informações, utilize quando quiser:

filtree -h
usage: filtree [-h] [-d] [-c] [-s] [--content N] [--depth N] [--ignore PATTERNS] [--no-default-ignore] [-a] [path]

Gera file trees em Markdown otimizado para LLMs

positional arguments:
  path                  Diretório alvo (padrão: .)

options:
  -h, --help            show this help message and exit
  -d, --dirs-only       Mostra apenas pastas
  -c, --copy            Copia output pro clipboard
  -s, --save            Salva filetree.md no diretório
  --content N           Inclui primeiras N linhas de cada arquivo
  --depth N             Limita profundidade da árvore
  --ignore PATTERNS     Padrões para ignorar (separados por vírgula)
  --no-default-ignore   Não usa padrões de ignore padrão
  -a, --all             Inclui arquivos ocultos (dotfiles)

Exemplos:
  filtree                          # Diretório atual
  filtree src/                     # Diretório específico
  filtree -d                       # Apenas pastas
  filtree --content 10             # Inclui primeiras 10 linhas
  filtree -cs                      # Copia e salva arquivo
  filtree --depth 2                # Limita a 2 níveis
  filtree --ignore "*.log,temp"    # Ignora padrões
