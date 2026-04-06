INSERT INTO public.products (name, description, points_cost, stock)
SELECT '果汁', '来一杯清爽果汁，补充能量继续出警！', 10, 10
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = '果汁');

INSERT INTO public.products (name, description, points_cost, stock)
SELECT '零食包', '小零食补给包，奖励认真完成任务的你。', 10, 10
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = '零食包');

INSERT INTO public.products (name, description, points_cost, stock)
SELECT '旅游', '一次特别的旅行奖励，和兔子警官一起出发吧。', 500, 2
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = '旅游');

INSERT INTO public.products (name, description, points_cost, stock)
SELECT '散装零食', '想吃一点点也可以，1 分就能换到。', 1, 99
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = '散装零食');

