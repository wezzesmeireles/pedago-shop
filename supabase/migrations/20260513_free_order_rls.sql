-- Permite que clientes autenticados criem pedidos para si mesmos
drop policy if exists "orders_insert_own" on orders;
create policy "orders_insert_own" on orders
  for insert with check (auth.uid() = user_id);

-- Permite que clientes autenticados adicionem itens a pedidos próprios
drop policy if exists "order_items_insert_for_own_order" on order_items;
create policy "order_items_insert_for_own_order" on order_items
  for insert with check (
    exists (select 1 from orders where id = order_items.order_id and user_id = auth.uid())
  );
