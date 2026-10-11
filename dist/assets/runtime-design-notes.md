# Runtime design notes

1. This portfolio includes an executable, synchronous Rust reference interpreter and a browser visualization of its design contracts, while distributed scheduling, asynchronous workers and production persistence remain separate implementations.

2. LangChain’s Runnable composition connects compatible input and output stages, with invocation, batching and streaming contracts that should remain explicit when an adapter can block streaming. [RunnableSequence](https://reference.langchain.com/python/langchain-core/runnables/base/RunnableSequence)

3. LangGraph’s graph compilation creates an executable Pregel application from state, nodes and edges; this graph validation is a different operation from compiling Rust into native machine code. [LangGraph runtime](https://docs.langchain.com/oss/python/langgraph/pregel)

4. A bulk-synchronous round selects active nodes, executes them against one prior snapshot and then applies their writes, so the browser’s separate inspection phases should not be mistaken for separate graph rounds. [Pregel execution model](https://docs.langchain.com/oss/python/langgraph/pregel) · [Original Pregel paper](https://research.google/pubs/pregel-a-system-for-large-scale-graph-processing/)

5. Passing a function locally means passing a callable value, such as a function pointer or a closure with captured configuration, whereas a durable task passes a versioned node reference and serializable arguments for a worker to resolve. [Rust closures](https://doc.rust-lang.org/book/ch13-01-closures.html)

6. The reference registry uses `Arc<dyn Fn(&State, &RunContext) -> Result<Transition, KernelError> + Send + Sync>`, whose ownership and sharing rules permit reusable callable dispatch without proving purity, idempotency or a security sandbox. [Rust Fn trait](https://doc.rust-lang.org/std/ops/trait.Fn.html) · [Closure types](https://doc.rust-lang.org/reference/types/closure.html)

7. An invocation environment injects identity, workspace scope, capabilities, deadlines and resource handles outside conversation state; recovery retains stable binding identifiers but reacquires live resources and revalidates authorization. [LangGraph runtime context](https://docs.langchain.com/oss/python/langgraph/graph-api#runtime-context)

8. A checkpoint represents a continuation as graph state, the remaining frontier, task identities and compatible code/schema versions, rather than the old process’s heap, stack, sockets or unfinished futures, and the downloadable reference deliberately keeps this checkpoint in memory. [LangGraph checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers)

9. Thread checkpoints and shared long-term stores have distinct lifetimes and access policies, so storing something outside a conversation does not by itself make it safe for another workspace to retrieve. [Checkpointers and stores](https://docs.langchain.com/oss/python/langgraph/persistence)

10. For total pure functions `f: A → B` and `g: B → C`, typed composition `g ∘ f: A → C` obeys associativity and identity, explaining why compatible pipeline grouping can change without changing its answer. [Fong & Spivak, Seven Sketches in Compositionality](https://arxiv.org/abs/1803.05316)

11. Errorful functions `A → Result<B,E>` compose through short-circuiting `and_then`, a Kleisli-style rule that does not make external actions atomic or exactly-once; the reference separates effect intents from its operation ledger and refuses blind resends after an uncertain outcome. [Rust Result](https://doc.rust-lang.org/std/result/enum.Result.html#method.and_then)

12. Associativity permits regrouping, commutativity additionally permits reordered arrivals and idempotence additionally permits duplicate application; set union over stable evidence IDs has all three with an empty identity, while list append is order-sensitive and floating-point addition is not strictly associative. [Applied category theory](https://arxiv.org/abs/1803.05316) · [LangGraph reducers](https://docs.langchain.com/oss/python/langgraph/graph-api#reducers)

13. Reproducing a decision requires recording its accepted external observations and model output, because replaying a saved result and recomputing a nondeterministic API or model call are different operations. [Checkpoint replay](https://docs.langchain.com/oss/python/langgraph/checkpointers#replay)

14. An asynchronous Rust worker would poll futures and use wakeups to progress other work while I/O waits, but the included kernel executes its frontier sequentially while preserving the snapshot and barrier semantics needed by a parallel implementation. [Rust Future](https://doc.rust-lang.org/std/future/trait.Future.html) · [Tokio runtime](https://docs.rs/tokio/latest/tokio/)

15. General program termination is undecidable, and a transition budget bounds only returning steps; deadlines, cooperative cancellation and process isolation are additional controls for slow or non-yielding nodes rather than proofs that an agent will converge on a correct answer. [Cornell, Limits of Computability](https://www.cs.cornell.edu/courses/cs4820/2019fa/lectures/4820_computability.pdf) · [LangGraph recursion limits](https://docs.langchain.com/oss/python/langgraph/graph-api#recursion-limit)
