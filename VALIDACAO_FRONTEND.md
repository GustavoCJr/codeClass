# Validação do frontend

## Verificações automatizadas

Execute `npm test` e `npm run build` na pasta do frontend.
Os testes usam respostas simuladas; não validam Supabase, banco, Gemini ou Piston em execução.
Nenhuma alteração de backend foi necessária nesta etapa.

## Jornada de aluno e professor em ambiente local

Use dados de teste para operações de exclusão.

1. Professor: crie uma sala, matricule um aluno existente e crie um questionário objetivo, um misto e uma atividade de código com casos de teste.
2. Aluno: faça login; confira Salas e Tarefas. Filtre por sala, status e título. Abra as três atividades.
3. Questionário objetivo: salve rascunho, recarregue, confirme respostas e entregue. Questões abertas: responda e entregue diretamente; rascunho permanece indisponível devido ao contrato atual.
4. Código: edite, execute testes, confira saídas/erros, altere o código e confira o aviso de resultado antigo. Salve, recarregue, confirme o código e entregue. Test-run não deve criar submissão.
5. Professor: abra a entrega, ajuste pontos e feedback, salve sem publicar. Aluno ainda não deve ver essa avaliação em Resultados. Publique e depois atualize a atividade do aluno: nota, feedback geral e detalhes por questão devem aparecer.
6. Aluno: abra Resultados, filtre por sala e título e abra a correção. Verifique também nota zero. Uma entrega em processamento deve aparecer em Tarefas com seu estado real.
7. Professor: edite nome/descrição da sala. Remova um aluno de teste e confira lista e contador. A conta institucional deve permanecer.
8. Professor: antes de qualquer submissão, edite configurações de uma atividade. Após submissões, confira que somente título, descrição, prazo e liberação ficam editáveis. Excluir atividade com submissões deve mostrar o erro do backend.
9. Professor: teste exclusão de atividade vazia e de uma sala descartável. Cancelar a confirmação não deve disparar DELETE. Exclusão da sala remove dados associados em cascata.
10. Correção: em falha da IA, solicite nova análise e atualize para acompanhar. Ajustes ainda não salvos de nota/feedback não devem ser apagados.
11. Teste prazo vencido, conta sem permissão, sessão expirada, erro no runner, sala sem atividades e resultados vazios. Confira temas claro/escuro, navegação por teclado e largura móvel.
12. Network: cada entrada protegida consulta `/users/me` uma vez; ações usam sessão/JWT. Nenhuma chave de IA deve ser enviada pelo browser.

## Limitações atuais

- Admin/Owner: abra Alunos, teste busca e paginação, cadastre uma conta de teste e depois matricule pela sala. Professor/Aluno não devem acessar o cadastro. Cancelar o formulário descarta a senha.
- Professor: abra Correções e Tarefas pela sidebar; filtre entregas por aluno, status e sala. Abra uma correção e navegue para a próxima; alterações não salvas devem disparar o aviso do navegador.

- Rascunhos de respostas abertas seguem indisponíveis; não houve correção no backend.
- O conteúdo de atividades com submissões é preservado na edição para manter a correspondência das respostas.
- Não existe arquivamento de sala integrado: o botão Excluir sala executa a exclusão definitiva existente.
- A execução com contas reais e o resultado de Gemini/Piston precisam da validação manual acima.
