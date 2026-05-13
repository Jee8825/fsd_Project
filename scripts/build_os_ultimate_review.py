from __future__ import annotations

import html
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    LongTable,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "OS_Ultimate_Exam_Review.pdf"


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="ReviewTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            textColor=colors.HexColor("#0f3251"),
            alignment=TA_CENTER,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ReviewSubTitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#31536f"),
            alignment=TA_CENTER,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="H1",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0f3251"),
            spaceBefore=8,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="H2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#134768"),
            spaceBefore=6,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="H3",
            parent=styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=10.2,
            leading=12.5,
            textColor=colors.HexColor("#173f5f"),
            spaceBefore=4,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.9,
            leading=11.0,
            textColor=colors.HexColor("#1d1d1d"),
            spaceAfter=2.2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyBold",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8.9,
            leading=11.0,
            textColor=colors.HexColor("#1d1d1d"),
            spaceAfter=2.2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ReviewBullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.7,
            leading=10.7,
            leftIndent=12,
            firstLineIndent=-8,
            bulletIndent=0,
            spaceAfter=1.4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Note",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=10.5,
            textColor=colors.HexColor("#12344d"),
            backColor=colors.HexColor("#eef7ff"),
            borderPadding=5,
            borderWidth=0.5,
            borderColor=colors.HexColor("#8eb7d9"),
            borderRadius=4,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Formula",
            parent=styles["BodyText"],
            fontName="Courier",
            fontSize=8.6,
            leading=10.2,
            textColor=colors.HexColor("#0e3550"),
            backColor=colors.HexColor("#f5fbff"),
            borderPadding=4,
            borderWidth=0.4,
            borderColor=colors.HexColor("#9bc4e2"),
            borderRadius=3,
            spaceAfter=3,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ReviewCode",
            parent=styles["BodyText"],
            fontName="Courier",
            fontSize=7.4,
            leading=8.8,
            textColor=colors.black,
            backColor=colors.HexColor("#f4f7fa"),
            leftIndent=6,
            rightIndent=6,
            borderPadding=5,
            borderWidth=0.4,
            borderColor=colors.HexColor("#b8c7d3"),
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Tiny",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=7.3,
            leading=8.5,
            textColor=colors.HexColor("#444"),
            spaceAfter=1.2,
        )
    )
    return styles


STYLES = build_styles()


def esc(text: str) -> str:
    return html.escape(text).replace("\n", "<br/>")


def p(text: str, style: str = "Body") -> Paragraph:
    return Paragraph(esc(text), STYLES[style])


def bullet(text: str) -> Paragraph:
    return Paragraph(esc(text), STYLES["ReviewBullet"], bulletText="•")


def codeblock(text: str) -> Preformatted:
    return Preformatted(text.strip("\n"), STYLES["ReviewCode"])


def banner(text: str):
    tbl = Table([[Paragraph(esc(text), STYLES["H1"])]], colWidths=[178 * mm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#dff1fb")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#8eb7d9")),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return tbl


def info_box(title: str, lines: list[str]):
    data = [[Paragraph(f"<b>{html.escape(title)}</b>", STYLES["BodyBold"])]]
    data.extend([[Paragraph(esc(line), STYLES["Body"])] for line in lines])
    tbl = Table(data, colWidths=[178 * mm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef7ff")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#fbfdff")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#9ebfd8")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d2e0ea")),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return tbl


def simple_table(headers: list[str], rows: list[list[str]], widths: list[float]):
    data = [[Paragraph(f"<b>{html.escape(h)}</b>", STYLES["Tiny"]) for h in headers]]
    for row in rows:
        data.append([Paragraph(esc(col), STYLES["Tiny"]) for col in row])
    tbl = LongTable(data, colWidths=widths, repeatRows=1)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dfeef9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#102f4a")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#9bbad3")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cedbe5")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fcff")]),
            ]
        )
    )
    return tbl


def section_title(title: str):
    return [Spacer(1, 3), p(title, "H2")]


def small_gap():
    return Spacer(1, 3)


def unit_header(unit_no: int, title: str):
    return [PageBreak(), banner(f"Unit {unit_no}: {title}")]


def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#b6c9d8"))
    canvas.setLineWidth(0.4)
    canvas.line(doc.leftMargin, 12 * mm, A4[0] - doc.rightMargin, 12 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#486276"))
    canvas.drawString(doc.leftMargin, 7.2 * mm, "Operating Systems Ultimate Exam Review")
    canvas.drawRightString(A4[0] - doc.rightMargin, 7.2 * mm, f"Page {doc.page}")
    canvas.restoreState()


def cover_story():
    items = [
        Spacer(1, 18 * mm),
        p("Operating Systems Ultimate Exam Review", "ReviewTitle"),
        p(
            "All five units condensed into one high-signal revision PDF: definitions, formulas, algorithms, tables, code patterns, worked examples, case studies, traps, and last-minute checks.",
            "ReviewSubTitle",
        ),
        Spacer(1, 6 * mm),
        info_box(
            "How to Use This PDF in the Final Hours",
            [
                "First pass: read the Formula Card, Comparison Tables, and Last-Minute Checklist.",
                "Second pass: revise the worked numericals for CPU scheduling, Banker's Algorithm, page replacement, and disk scheduling.",
                "Third pass: scan the code patterns and case-study one-liners so named questions do not surprise you.",
                "This document is intentionally dense. Every line is here because it is exam-relevant.",
            ],
        ),
        Spacer(1, 5 * mm),
        p("What this PDF covers", "H2"),
    ]
    items.extend(
        bullet(line)
        for line in [
            "Unit I: OS overview, booting, kernel, system calls, process model, IPC, threads, zombie processes, lottery scheduling.",
            "Unit II: CPU scheduling, criteria, FCFS/SJF/SRTF/RR/Priority/LRTF, critical-section theory, semaphores, classical synchronization problems, Dekker/Bakery.",
            "Unit III: Deadlocks, Coffman conditions, RAG, prevention/avoidance/detection/recovery, Banker's Algorithm, contiguous allocation, paging, segmentation, Android memory management.",
            "Unit IV: Virtual memory, page faults, FIFO/LRU/Optimal/Clock, thrashing, file systems, directories, allocation methods, free-space methods, disk scheduling, buddy system.",
            "Unit V: RTOS, RM/EDF schedulability, FreeRTOS essentials, fault tolerance, virtualization, hypervisors, containers, Docker, containers vs VMs.",
        ]
    )
    items.extend(
        [
            Spacer(1, 5 * mm),
            p("Exam principle: if it can be asked for 2 marks, 5 marks, 10 marks, or as a numerical, it appears somewhere in this review.", "Note"),
        ]
    )
    return items


def formula_card():
    story = [PageBreak(), banner("Formula Card and Fast Recall")]
    story.extend(section_title("Core Scheduling Formulas"))
    story.extend(
        [
            p("TAT = CT - AT", "Formula"),
            p("WT = TAT - BT = CT - AT - BT", "Formula"),
            p("Response Time = First CPU start time - AT", "Formula"),
            p("CPU Utilization = (Useful CPU time / Total time) x 100", "Formula"),
            p("Throughput = Processes completed / unit time", "Formula"),
        ]
    )
    story.extend(section_title("Burst Prediction and Context Switch"))
    story.extend(
        [
            p("tau(n+1) = alpha x t(n) + (1 - alpha) x tau(n)", "Formula"),
            p("Context switch = save current PCB state + load next PCB state; pure overhead, no useful work.", "Body"),
        ]
    )
    story.extend(section_title("Lottery Scheduling"))
    story.append(p("P(process gets CPU) = tickets held by process / total tickets", "Formula"))
    story.extend(section_title("Banker's Algorithm"))
    story.extend(
        [
            p("Need[i][j] = Max[i][j] - Allocation[i][j]", "Formula"),
            p("Safe state: there exists a sequence where each process can finish with current Available plus resources released by earlier finished processes.", "Body"),
        ]
    )
    story.extend(section_title("Address Translation"))
    story.extend(
        [
            p("Base-limit relocation: Physical address = Base register + Logical address", "Formula"),
            p("Paging: Logical address = <page number, offset>; Physical address = <frame number, offset>", "Formula"),
            p("Segmentation: Physical address = Segment base + offset, valid only if offset < segment limit", "Formula"),
        ]
    )
    story.extend(section_title("TLB and Page Fault EAT"))
    story.extend(
        [
            p("EAT with TLB = h x (TLB access + memory access) + (1 - h) x (TLB access + 2 x memory access)", "Formula"),
            p("EAT with demand paging = (1 - p) x memory access + p x page fault service time", "Formula"),
        ]
    )
    story.extend(section_title("RM and EDF"))
    story.extend(
        [
            p("Utilization U = sum(Ci / Ti)", "Formula"),
            p("RM sufficient test: U <= n(2^(1/n) - 1)", "Formula"),
            p("EDF schedulability test for periodic tasks: U <= 1", "Formula"),
            p("Laxity = Deadline - Computation time needed - elapsed time", "Formula"),
        ]
    )
    story.extend(section_title("Disk Access"))
    story.extend(
        [
            p("Disk access time = Seek time + rotational latency + transfer time", "Formula"),
            p("Average rotational latency = 1/2 x rotation time", "Formula"),
        ]
    )
    story.extend(section_title("Critical Exam Reminders"))
    story.extend(
        bullet(item)
        for item in [
            "FIFO page replacement can show Belady's anomaly. LRU and Optimal do not.",
            "In producer-consumer, do wait(empty/full) before wait(mutex) to avoid deadlock.",
            "Zombie: child is dead, parent alive, wait() not called. Orphan: child alive, parent dead.",
            "A cycle in RAG guarantees deadlock only when each resource type has a single instance.",
            "Demand paging performance is acceptable only when page faults are extremely rare.",
        ]
    )
    return story


def trap_card():
    traps = [
        ("Program vs process", "Program is passive code on disk; process is that program in execution with state, stack, heap, registers, and PCB."),
        ("Kernel mode vs user mode", "Kernel mode has unrestricted access; user mode cannot execute privileged instructions."),
        ("Running -> Ready", "This transition is preemption by timer interrupt, not I/O request."),
        ("Waiting -> Ready", "This happens when I/O completes and interrupt notifies the OS."),
        ("Context switch", "Pure overhead; reduces throughput if done too often."),
        ("SJF vs SRTF", "SJF is non-preemptive shortest burst; SRTF is preemptive shortest remaining burst."),
        ("Priority scheduling starvation", "Fixed low-priority process can wait forever; fix with aging."),
        ("Mutex vs binary semaphore", "Mutex has ownership; semaphore can be signalled by any process/thread."),
        ("Safe state vs deadlock", "Unsafe does not mean deadlocked; it means deadlock is possible."),
        ("FIFO anomaly", "More frames can increase faults only for FIFO; this is Belady's anomaly."),
        ("LOOK vs SCAN", "LOOK stops at last request in that direction; SCAN goes to physical end."),
        ("Hard vs soft real-time", "Hard miss = system failure; soft miss = degraded quality."),
    ]
    story = [PageBreak(), banner("Professor Trap Card")]
    story.append(p("These are the short conceptual differences that cost marks when written vaguely.", "Body"))
    story.append(simple_table(["Trap Topic", "What to Write"], traps, [48 * mm, 130 * mm]))
    return story


def unit1_story():
    story = unit_header(1, "Operating System Overview, Processes, IPC, and Threads")
    story.extend(section_title("30-Second Big Picture"))
    story.append(
        p(
            "An operating system is system software that manages hardware resources and provides services for program execution. Think of it simultaneously as a resource manager, an extended machine that hides ugly hardware details, and a protection boundary between programs and the hardware.",
            "Body",
        )
    )
    story.extend(section_title("Core Objectives"))
    story.extend(
        bullet(item)
        for item in [
            "Convenience: make the computer easy to use via abstractions like files and processes.",
            "Efficiency: maximize useful hardware usage; keep CPU, memory, and I/O productive.",
            "Ability to evolve: support new hardware and new features without rewriting the full stack.",
            "Protection: isolate programs so one cannot corrupt another or the kernel.",
        ]
    )
    story.extend(section_title("Seven Functions of an OS"))
    story.append(
        simple_table(
            ["Function", "One-line definition"],
            [
                ["Process management", "Create, schedule, suspend, resume, and terminate processes."],
                ["Memory management", "Track RAM usage and allocate/free memory safely."],
                ["File management", "Create, organize, access, protect, and delete files."],
                ["Device management", "Control I/O devices through drivers and device interfaces."],
                ["Security and protection", "Authenticate users and isolate processes and data."],
                ["Networking", "Manage communication across systems and processes."],
                ["Error detection", "Detect and respond to hardware and software faults."],
            ],
            [48 * mm, 130 * mm],
        )
    )
    story.extend(section_title("OS Types and Progression"))
    story.append(
        simple_table(
            ["Type", "Essence", "Exam note"],
            [
                ["Batch OS", "Jobs run in sequence, no interaction.", "CPU often idle during I/O."],
                ["Multiprogramming", "Multiple jobs in memory; switch on I/O wait.", "Improves CPU utilization."],
                ["Time-sharing / multitasking", "Rapid time slices create interactivity.", "UNIX is the classic example."],
                ["Multiprocessing", "Multiple CPUs execute truly in parallel.", "Not just fast switching."],
                ["Distributed OS", "Networked machines appear as one system.", "Rare and complex."],
                ["RTOS", "Deadline-focused OS.", "Covered deeply in Unit V."],
                ["Mobile OS", "Battery-aware, touch-oriented, memory-constrained.", "Android and iOS."],
            ],
            [36 * mm, 88 * mm, 54 * mm],
        )
    )
    story.extend(section_title("OS Services"))
    story.extend(
        bullet(item)
        for item in [
            "Program execution, I/O operations, file-system manipulation, process communication, error detection.",
            "Resource allocation, accounting, protection, and security.",
            "Standard user-facing services are usually reached through library wrappers over system calls.",
        ]
    )
    story.extend(section_title("Boot Block and Boot Sequence"))
    story.extend(
        bullet(item)
        for item in [
            "Power on: CPU starts at a fixed ROM address.",
            "BIOS/UEFI runs POST to test CPU, RAM, keyboard, and basic device sanity.",
            "Firmware reads the Master Boot Record or EFI boot data from storage.",
            "Boot loader loads the kernel into RAM.",
            "Kernel initializes memory, devices, scheduler, and starts init/systemd.",
            "Boot block: first storage sector containing the bootstrap loader code.",
        ]
    )
    story.extend(section_title("Kernel Fundamentals"))
    story.extend(
        bullet(item)
        for item in [
            "Kernel is the privileged core of the OS running in kernel mode.",
            "User processes run in user mode and must request privileged actions via system calls.",
            "Kernel mode crash can panic the whole system; user mode crash usually kills only that process.",
        ]
    )
    story.append(
        simple_table(
            ["Kernel Type", "What runs in kernel space", "Pros", "Cons", "Examples"],
            [
                ["Monolithic", "File system, memory manager, drivers, scheduler, IPC all together", "Fast direct calls", "Buggy driver can crash all", "Linux, classic UNIX"],
                ["Microkernel", "Only minimal IPC, scheduling, low-level memory", "High reliability, easy restart of servers", "More message passing overhead", "QNX, Minix, L4"],
                ["Hybrid", "Performance-critical parts in kernel, modular remainder", "Balanced design", "More complex than either extreme", "Windows NT, macOS XNU"],
            ],
            [24 * mm, 61 * mm, 28 * mm, 34 * mm, 31 * mm],
        )
    )
    story.extend(section_title("System Calls"))
    story.append(
        p(
            "A system call is the only legal path from user space to kernel services. User code usually calls a library function such as printf(), the wrapper loads the syscall number and arguments, executes a trap instruction, the CPU switches to kernel mode, the kernel performs the service, then returns to user mode.",
            "Body",
        )
    )
    story.append(
        simple_table(
            ["Category", "Examples"],
            [
                ["Process control", "fork(), exec(), exit(), wait()"],
                ["File management", "open(), read(), write(), close()"],
                ["Device management", "ioctl(), read(), write()"],
                ["Information", "getpid(), sleep(), alarm()"],
                ["Communication", "pipe(), socket(), shmget(), msgget()"],
                ["Protection", "chmod(), chown()"],
            ],
            [55 * mm, 123 * mm],
        )
    )
    story.append(
        codeblock(
            """
#include <unistd.h>
#include <stdio.h>

int main(void) {
    pid_t pid = fork();
    if (pid == 0) {
        printf("Child: %d\\n", getpid());
    } else if (pid > 0) {
        printf("Parent: %d\\n", getpid());
    }
    return 0;
}
""".strip()
        )
    )
    story.extend(section_title("Program, Process, and Five-State Model"))
    story.extend(
        bullet(item)
        for item in [
            "Program: passive executable file on disk. Process: program in execution, with PC, stack, heap, registers, and PCB.",
            "Same program can create many processes simultaneously, such as multiple Chrome processes from one binary.",
            "Five states: New, Ready, Running, Waiting/Blocked, Terminated.",
            "Running -> Waiting: process requests I/O. Running -> Ready: preemption. Waiting -> Ready: I/O completes.",
        ]
    )
    story.append(
        simple_table(
            ["State", "Meaning"],
            [
                ["New", "Process is being created, not yet admitted to ready queue."],
                ["Ready", "In memory and waiting for CPU."],
                ["Running", "Currently executing on the CPU."],
                ["Waiting/Blocked", "Waiting for I/O or an event."],
                ["Terminated", "Finished; OS is reclaiming remaining state."],
            ],
            [38 * mm, 140 * mm],
        )
    )
    story.extend(section_title("Process Control Block"))
    story.extend(
        bullet(item)
        for item in [
            "PID, process state, program counter, CPU registers.",
            "Scheduling information such as priority and queue pointers.",
            "Memory-management data such as page tables or base-limit values.",
            "Accounting information such as CPU time used.",
            "I/O status such as open files and assigned devices.",
        ]
    )
    story.append(p("Context switch = save Process A state into PCB A, load Process B state from PCB B, resume B. It is pure overhead.", "Note"))
    story.extend(section_title("Process Creation and Termination"))
    story.extend(
        bullet(item)
        for item in [
            "fork() duplicates the calling process. Child gets return value 0; parent gets child's PID.",
            "After fork(), child often calls exec() to replace its memory image with a new program.",
            "exit(status) terminates voluntarily; parent collects the status via wait()/waitpid().",
            "Parent not calling wait() creates zombie. Parent dying first creates orphan adopted by init/systemd.",
        ]
    )
    story.append(
        codeblock(
            """
pid_t pid = fork();

if (pid == 0) {
    // child
} else if (pid > 0) {
    wait(NULL);   // parent reaps child
} else {
    perror("fork failed");
}
""".strip()
        )
    )
    story.extend(section_title("IPC Models and Mechanisms"))
    story.append(
        simple_table(
            ["Model / Mechanism", "Speed", "Key exam note"],
            [
                ["Shared memory", "Fastest", "Kernel needed only for setup; synchronization is mandatory."],
                ["Message passing", "Moderate", "Kernel mediates communication; simpler but slower."],
                ["Pipe", "Fast", "Unidirectional, usually parent-child."],
                ["Named pipe FIFO", "Fast", "Can connect unrelated processes."],
                ["Message queue", "Moderate", "Kernel-managed message storage."],
                ["Socket", "Moderate-slow", "Works across networks as well."],
                ["Signal", "Tiny payload", "Asynchronous notification, not general data transfer."],
            ],
            [52 * mm, 24 * mm, 102 * mm],
        )
    )
    story.extend(section_title("Threads"))
    story.extend(
        bullet(item)
        for item in [
            "Thread = smallest unit of execution. Threads in one process share code, data, heap, and open files.",
            "Each thread has its own stack, registers, program counter, and thread ID.",
            "Benefits: responsiveness, resource sharing, economy, scalability across multiple cores.",
        ]
    )
    story.append(
        simple_table(
            ["Aspect", "Process", "Thread"],
            [
                ["Address space", "Separate", "Shared within the process"],
                ["Creation cost", "High", "Low"],
                ["Context switch", "Expensive", "Cheaper"],
                ["Communication", "Needs IPC", "Uses shared variables"],
                ["Crash effect", "Usually isolated", "Can crash whole process"],
            ],
            [35 * mm, 71 * mm, 72 * mm],
        )
    )
    story.extend(
        bullet(item)
        for item in [
            "Many-to-one: cheap but no true parallelism and one blocking call blocks all.",
            "One-to-one: each user thread maps to a kernel thread; real systems use this.",
            "Many-to-many: flexible but complex; uncommon in mainstream desktop OSes.",
        ]
    )
    story.append(
        codeblock(
            """
#include <pthread.h>
#include <stdio.h>

void *task(void *arg) {
    int id = *(int *)arg;
    printf("Thread %d running\\n", id);
    return NULL;
}

int main(void) {
    pthread_t t1, t2;
    int a = 1, b = 2;
    pthread_create(&t1, NULL, task, &a);
    pthread_create(&t2, NULL, task, &b);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    return 0;
}
""".strip()
        )
    )
    story.extend(section_title("Threading Issues"))
    story.extend(
        bullet(item)
        for item in [
            "fork() in a multithreaded process duplicates only the calling thread in POSIX.",
            "Signal handling can target a specific thread or any eligible thread.",
            "Asynchronous cancellation is unsafe; deferred cancellation at safe points is preferred.",
            "Thread-local storage behaves like global data but exists separately per thread, such as errno.",
        ]
    )
    story.extend(section_title("Case Study: Zombie Process"))
    story.extend(
        bullet(item)
        for item in [
            "Zombie = child already terminated, but parent still alive and has not called wait().",
            "Zombie keeps only a tiny process-table entry with exit status; memory, CPU, and files are already gone.",
            "Too many zombies exhaust PID/process-table slots and make fork() fail with resource temporarily unavailable.",
        ]
    )
    story.append(
        codeblock(
            """
void handler(int sig) {
    while (waitpid(-1, NULL, WNOHANG) > 0) { }
}

signal(SIGCHLD, handler);
""".strip()
        )
    )
    story.extend(
        bullet(item)
        for item in [
            "Prevention methods: call wait()/waitpid(), use SIGCHLD handler, ignore SIGCHLD, or use double fork.",
            "Orphan = child still running but parent dead. Zombie = child dead but parent alive and not reaped.",
        ]
    )
    story.extend(section_title("Case Study: Lottery Scheduling"))
    story.extend(
        bullet(item)
        for item in [
            "Each process gets tickets. At each scheduling event, a random ticket is drawn; winner gets CPU.",
            "Probability is proportional to ticket count. Over time this gives proportional fairness.",
            "Ticket transfer helps priority inversion situations; ticket currency allows per-user internal weighting.",
            "Non-deterministic behavior makes it unsuitable for hard real-time systems.",
        ]
    )
    return story


def unit2_story():
    story = unit_header(2, "CPU Scheduling and Process Synchronization")
    story.extend(section_title("30-Second Big Picture"))
    story.append(
        p(
            "Scheduling decides which ready process gets the CPU and for how long. Synchronization makes concurrent processes or threads coordinate safely while accessing shared data. Most numericals in OS come from this unit.",
            "Body",
        )
    )
    story.extend(section_title("Scheduler, Dispatcher, and Criteria"))
    story.extend(
        bullet(item)
        for item in [
            "Long-term scheduler admits jobs to the system; short-term scheduler selects the next ready process; medium-term scheduler swaps processes in/out.",
            "Dispatcher performs the actual context switch, switches privilege mode, and jumps to the selected instruction. Dispatch latency should be low.",
            "Criteria: CPU utilization high, throughput high, turnaround/waiting/response time low.",
        ]
    )
    story.append(
        simple_table(
            ["Criterion", "Goal", "Formula / Note"],
            [
                ["CPU utilization", "Maximize", "(Useful CPU time / Total time) x 100"],
                ["Throughput", "Maximize", "Processes completed per unit time"],
                ["Turnaround time", "Minimize", "CT - AT"],
                ["Waiting time", "Minimize", "TAT - BT"],
                ["Response time", "Minimize", "First CPU time - AT"],
            ],
            [38 * mm, 26 * mm, 114 * mm],
        )
    )
    story.extend(section_title("Preemptive vs Non-Preemptive"))
    story.extend(
        bullet(item)
        for item in [
            "Non-preemptive: running process keeps CPU until it blocks or finishes.",
            "Preemptive: OS may forcibly take CPU using timer interrupt or higher-priority arrival.",
            "Interactive systems need preemption; non-preemptive algorithms are simpler but can delay short jobs badly.",
        ]
    )
    story.extend(section_title("Master Scheduling Example Used Below"))
    story.append(
        simple_table(
            ["Process", "AT", "BT"],
            [["P1", "0", "5"], ["P2", "1", "3"], ["P3", "2", "8"], ["P4", "3", "6"]],
            [38 * mm, 20 * mm, 20 * mm],
        )
    )
    story.extend(section_title("FCFS"))
    story.extend(
        bullet(item)
        for item in [
            "Non-preemptive FIFO order. Simple to implement.",
            "Using the master example: Gantt = P1 0-5, P2 5-8, P3 8-16, P4 16-22.",
            "Average TAT = 11.25, average WT = 5.75.",
            "Convoy effect: one long job at front makes all short jobs wait.",
        ]
    )
    story.extend(section_title("SJF and SRTF"))
    story.extend(
        bullet(item)
        for item in [
            "SJF: non-preemptive shortest next burst first. Provably optimal among non-preemptive policies for average waiting time.",
            "Master example SJF Gantt = P1 0-5, P2 5-8, P4 8-14, P3 14-22. Avg WT = 5.25.",
            "SRTF: preemptive SJF. At each moment run the process with the shortest remaining time.",
            "Master example SRTF Gantt = P1 0-1, P2 1-4, P1 4-8, P4 8-14, P3 14-22. Avg WT = 5.0.",
            "Long processes can starve if short jobs keep arriving. Fix with aging in priority systems, not in pure SRTF/SJF.",
        ]
    )
    story.append(p("Burst prediction uses exponential averaging: tau(n+1) = alpha x actual_last + (1 - alpha) x old_prediction", "Formula"))
    story.extend(section_title("LRTF"))
    story.extend(
        bullet(item)
        for item in [
            "Longest Remaining Time First is the opposite of SRTF.",
            "Rarely used in practice because short jobs suffer very high waiting time and starvation risk.",
        ]
    )
    story.extend(section_title("Round Robin"))
    story.extend(
        bullet(item)
        for item in [
            "Preemptive, time quantum q. After q expires, unfinished process goes to queue tail.",
            "Best for time-sharing because response time is bounded.",
            "Quantum too large -> FCFS behavior. Quantum too small -> too many context switches.",
            "Rule of thumb: around 80% of CPU bursts should finish within the chosen quantum.",
        ]
    )
    story.append(
        info_box(
            "Master Example RR with q = 2",
            [
                "Gantt = P1 0-2, P2 2-4, P3 4-6, P4 6-8, P1 8-10, P2 10-11, P3 11-13, P4 13-15, P1 15-16, P3 16-18, P4 18-20, P3 20-22.",
                "Completion times: P1=16, P2=11, P3=22, P4=20.",
                "Average TAT = 15.75, average WT = 10.25. Worse average waiting than SJF, but much better response for interactive users.",
            ],
        )
    )
    story.extend(section_title("Priority Scheduling"))
    story.extend(
        bullet(item)
        for item in [
            "Can be preemptive or non-preemptive. Smaller priority number is usually higher priority in textbooks unless otherwise stated.",
            "Starvation risk for low-priority jobs. Aging gradually improves priority of waiting jobs to prevent this.",
        ]
    )
    story.append(
        simple_table(
            ["Algorithm", "Type", "Best use", "Main risk"],
            [
                ["FCFS", "Non-preemptive", "Simple batch systems", "Convoy effect"],
                ["SJF", "Non-preemptive", "Minimum average WT if burst known", "Starvation of long jobs"],
                ["SRTF", "Preemptive", "Minimum average WT among preemptive policies", "Starvation of long jobs"],
                ["RR", "Preemptive", "Interactive time-sharing", "Context-switch overhead"],
                ["Priority", "Either", "Service differentiation", "Low-priority starvation"],
                ["LRTF", "Preemptive", "Mostly academic comparison", "Short-job starvation"],
            ],
            [34 * mm, 30 * mm, 61 * mm, 53 * mm],
        )
    )
    story.extend(section_title("Race Condition and Critical Section Problem"))
    story.extend(
        bullet(item)
        for item in [
            "Race condition: output depends on unpredictable interleaving of concurrent operations on shared data.",
            "Critical section: part of code that accesses shared data and must not be executed by multiple processes simultaneously.",
            "Three requirements: mutual exclusion, progress, bounded waiting.",
        ]
    )
    story.append(
        codeblock(
            """
// Lost update example
counter++;
counter++;
// Machine-level interleaving can leave counter incremented only once.
""".strip()
        )
    )
    story.extend(section_title("Peterson's Solution"))
    story.extend(
        bullet(item)
        for item in [
            "Software-only solution for exactly two processes.",
            "Shared variables: flag[2] indicates interest; turn breaks ties.",
            "Works conceptually for mutual exclusion, progress, and bounded waiting, but modern CPUs need memory barriers for strict correctness.",
        ]
    )
    story.append(
        codeblock(
            """
int turn;
bool flag[2] = {false, false};

// Process i, where j = 1 - i
flag[i] = true;
turn = j;
while (flag[j] && turn == j) { }
// critical section
flag[i] = false;
""".strip()
        )
    )
    story.extend(section_title("Hardware Synchronization"))
    story.extend(
        bullet(item)
        for item in [
            "Test-and-set atomically reads a value and sets it true. It can implement a spinlock.",
            "Compare-and-swap atomically changes a location only if it still holds an expected value.",
            "Both are atomic hardware primitives but waste CPU under long waits if used with busy waiting.",
        ]
    )
    story.append(
        codeblock(
            """
bool lock = false;
while (TestAndSet(&lock)) { }   // spin
// critical section
lock = false;
""".strip()
        )
    )
    story.extend(section_title("Mutexes and Semaphores"))
    story.append(
        simple_table(
            ["Primitive", "Count/ownership", "Waiting style", "Use"],
            [
                ["Mutex", "Binary, owner must release", "Usually blocking", "Mutual exclusion"],
                ["Spinlock", "Binary, owner releases", "Busy wait", "Very short waits in kernels"],
                ["Binary semaphore", "0/1, no ownership rule", "Blocking", "Mutual exclusion or events"],
                ["Counting semaphore", "0..N", "Blocking", "Resource pools, ordering constraints"],
            ],
            [34 * mm, 60 * mm, 33 * mm, 51 * mm],
        )
    )
    story.append(
        codeblock(
            """
wait(S):    S--;
            if (S < 0) block this process;

signal(S):  S++;
            if (S <= 0) wake one blocked process;
""".strip()
        )
    )
    story.extend(
        bullet(item)
        for item in [
            "Binary semaphore initialized to 1 behaves like a lock, but any process can signal it.",
            "Counting semaphore initialized to N tracks N identical resources.",
            "Semaphores can enforce ordering: initialize sync = 0, Process 2 waits(sync), Process 1 signals(sync) after A(), so B() runs only after A().",
        ]
    )
    story.extend(section_title("Producer-Consumer"))
    story.extend(
        bullet(item)
        for item in [
            "Use semaphores mutex=1, empty=N, full=0.",
            "Producer order: wait(empty), wait(mutex), insert item, signal(mutex), signal(full).",
            "Consumer order: wait(full), wait(mutex), remove item, signal(mutex), signal(empty).",
            "Never do wait(mutex) before wait(empty/full); that can deadlock the system.",
        ]
    )
    story.append(
        codeblock(
            """
// Producer
wait(empty);
wait(mutex);
buffer[in] = item;
in = (in + 1) % N;
signal(mutex);
signal(full);

// Consumer
wait(full);
wait(mutex);
item = buffer[out];
out = (out + 1) % N;
signal(mutex);
signal(empty);
""".strip()
        )
    )
    story.extend(section_title("Readers-Writers and Dining Philosophers"))
    story.extend(
        bullet(item)
        for item in [
            "Readers-writers first solution: multiple readers may read together; writers need exclusive access.",
            "First reader waits on rw_mutex; last reader signals rw_mutex. Readers-preference can starve writers.",
            "Dining philosophers naive left-then-right solution deadlocks because all can hold one chopstick and wait for the other.",
            "Fixes: allow at most 4 philosophers, asymmetric pickup order, atomic pickup, or monitor-based solution.",
        ]
    )
    story.extend(section_title("Sleeping Barber, Dekker, Bakery"))
    story.extend(
        bullet(item)
        for item in [
            "Sleeping barber uses customers, barber, and mutex semaphores plus waiting-chair count.",
            "Dekker's Algorithm is the earliest full software solution for two-process mutual exclusion; more complex than Peterson.",
            "Bakery Algorithm works for n processes: choose a ticket number, then smallest number wins; ties broken by PID.",
        ]
    )
    story.append(
        simple_table(
            ["Problem", "Core idea", "Classic issue"],
            [
                ["Producer-consumer", "Synchronize full/empty slots plus mutual exclusion", "Wrong wait order causes deadlock"],
                ["Readers-writers", "Readers can share, writers need exclusivity", "Reader preference can starve writers"],
                ["Dining philosophers", "Need two chopsticks to eat", "Circular wait causes deadlock"],
                ["Sleeping barber", "Barber sleeps until customers arrive", "Need correct semaphore coordination"],
            ],
            [42 * mm, 70 * mm, 66 * mm],
        )
    )
    return story


def unit3_story():
    story = unit_header(3, "Deadlocks and Memory Management")
    story.extend(section_title("Deadlock Fundamentals"))
    story.extend(
        bullet(item)
        for item in [
            "Deadlock = a set of processes each waiting for an event that only another process in the same set can cause.",
            "All four Coffman conditions must hold simultaneously: mutual exclusion, hold and wait, no preemption, circular wait.",
            "If you eliminate even one condition by system design, deadlock is impossible.",
        ]
    )
    story.append(
        simple_table(
            ["Condition", "Meaning", "Typical prevention idea"],
            [
                ["Mutual exclusion", "At least one resource is non-shareable", "Make resource shareable if possible"],
                ["Hold and wait", "Process holds some resources while requesting more", "Request all at once or release before requesting"],
                ["No preemption", "Resources cannot be forcibly taken away", "Allow forced release where practical"],
                ["Circular wait", "Closed chain of waiting processes exists", "Impose total ordering on resource requests"],
            ],
            [36 * mm, 74 * mm, 68 * mm],
        )
    )
    story.extend(section_title("Resource Allocation Graph"))
    story.extend(
        bullet(item)
        for item in [
            "Process = circle, resource = rectangle, dots inside rectangle = number of instances.",
            "Request edge P -> R means process requests a resource; assignment edge R -> P means resource instance already assigned.",
            "No cycle means no deadlock. Cycle with single instance of each resource means deadlock for sure. Cycle with multiple instances means deadlock is only possible, not guaranteed.",
        ]
    )
    story.extend(section_title("Strategies for Handling Deadlock"))
    story.append(
        simple_table(
            ["Strategy", "Idea", "Key note"],
            [
                ["Prevention", "Break a Coffman condition", "Safe but restrictive"],
                ["Avoidance", "Grant request only if resulting state remains safe", "Uses Banker's Algorithm"],
                ["Detection and recovery", "Allow deadlock, detect later, recover", "Practical in many systems"],
                ["Ignore (ostrich)", "Assume deadlock is rare", "Common in UNIX/Windows general workloads"],
            ],
            [35 * mm, 59 * mm, 84 * mm],
        )
    )
    story.extend(section_title("Banker's Algorithm"))
    story.extend(
        bullet(item)
        for item in [
            "Data structures: Available, Max, Allocation, Need where Need = Max - Allocation.",
            "Safety algorithm repeatedly looks for an unfinished process whose Need <= Work. If found, assume it finishes and releases Allocation back into Work.",
            "If all processes can finish in some sequence, system is safe. Unsafe does not automatically mean deadlocked, but request must be denied under avoidance.",
        ]
    )
    story.append(
        info_box(
            "Classic Worked Example",
            [
                "Total resources: A=10, B=5, C=7. Available = (3,3,2).",
                "Allocation: P0=(0,1,0), P1=(2,0,0), P2=(3,0,2), P3=(2,1,1), P4=(0,0,2).",
                "Max: P0=(7,5,3), P1=(3,2,2), P2=(9,0,2), P3=(2,2,2), P4=(4,3,3).",
                "Need becomes: P0=(7,4,3), P1=(1,2,2), P2=(6,0,0), P3=(0,1,1), P4=(4,3,1).",
                "Safe sequence from the standard example: <P1, P3, P0, P2, P4>.",
                "Request by P1 for (1,0,2) can be granted because the new state remains safe.",
                "Request by P4 for (3,3,0) is available but unsafe, so it must be denied.",
            ],
        )
    )
    story.extend(section_title("Deadlock Detection and Recovery"))
    story.extend(
        bullet(item)
        for item in [
            "Single instance detection uses wait-for graph. Cycle means deadlock.",
            "Multiple instance detection resembles Banker's safety algorithm, but Finish[i] initially true if Allocation[i] = 0.",
            "Recovery: abort all deadlocked processes, abort one at a time, or preempt resources with rollback.",
            "Victim selection considers priority, resources held, work already done, and repeat-victim starvation risk.",
        ]
    )
    story.extend(section_title("Memory Management Fundamentals"))
    story.extend(
        bullet(item)
        for item in [
            "Goals: track memory use, allocate and free space, protect processes, and support relocation/sharing.",
            "Address binding times: compile time, load time, execution time.",
            "Logical address is what CPU/program sees; physical address is the actual RAM address.",
            "MMU translates logical to physical, often using base register plus offset or page tables.",
        ]
    )
    story.extend(section_title("Swapping and Contiguous Allocation"))
    story.extend(
        bullet(item)
        for item in [
            "Swapping moves an entire process between RAM and backing store. Very expensive because disk I/O dominates.",
            "Fixed partitions cause internal fragmentation because partition may exceed process size.",
            "Variable partitions avoid internal fragmentation but cause external fragmentation as holes accumulate.",
            "Allocation policies: first fit, best fit, worst fit, next fit. First fit is fastest and usually practical.",
            "Compaction merges scattered holes into one by relocating processes; requires relocatable execution-time binding.",
        ]
    )
    story.extend(section_title("Paging"))
    story.extend(
        bullet(item)
        for item in [
            "Logical memory is divided into fixed-size pages; physical memory into same-size frames.",
            "Any page can be loaded into any free frame, eliminating external fragmentation.",
            "Logical address = <page number, offset>; page table maps page number to frame number; physical address = <frame number, offset>.",
            "Page-table entry includes frame number, valid/invalid bit, protection bits, reference bit, dirty bit.",
        ]
    )
    story.append(
        info_box(
            "Paging Example",
            [
                "16-bit logical address, page size = 4 KB = 2^12 bytes.",
                "Offset uses 12 bits, page number uses remaining 4 bits.",
                "If logical address 0x3A4F has page number 3 and offset 0xA4F, and page table maps page 3 -> frame 7, then physical address = 7 x 4096 + 2639 = 31311.",
            ],
        )
    )
    story.extend(section_title("TLB and Page Table Structures"))
    story.extend(
        bullet(item)
        for item in [
            "TLB is a fast associative cache storing recent page -> frame translations to avoid two memory accesses per reference.",
            "EAT with TLB hit ratio h = h(TLB + memory) + (1-h)(TLB + 2 memory).",
            "Single-level page tables are simple but large. Multi-level page tables allocate page-table pages only where used. Inverted page table uses one entry per physical frame instead of per virtual page.",
        ]
    )
    story.extend(section_title("Segmentation"))
    story.extend(
        bullet(item)
        for item in [
            "Segmentation matches programmer-visible logical units such as code, data, stack, heap.",
            "Logical address = <segment number, offset>. Segment table stores base and limit.",
            "Valid if offset < limit. Physical address = base + offset.",
            "Segmentation fits logical protection and sharing but suffers external fragmentation.",
        ]
    )
    story.append(
        simple_table(
            ["Feature", "Paging", "Segmentation"],
            [
                ["Division", "Fixed-size pages", "Variable-size logical segments"],
                ["External fragmentation", "No", "Yes"],
                ["Internal fragmentation", "Possible in final page", "No"],
                ["Programmer visibility", "Mostly invisible", "Matches program structure"],
                ["Address format", "<page, offset>", "<segment, offset>"],
            ],
            [34 * mm, 72 * mm, 72 * mm],
        )
    )
    story.extend(section_title("Segmentation with Paging and Android Case Study"))
    story.extend(
        bullet(item)
        for item in [
            "x86 style segmentation with paging first chooses a segment, then pages within that segment; combines logical structure with no external fragmentation.",
            "Android Zygote preloads the framework and forks apps so they share framework pages via copy-on-write.",
            "Low Memory Killer terminates background processes when RAM pressure rises instead of relying heavily on swap.",
            "Android also uses ZRAM, ION allocator, and KSM to stretch limited mobile RAM.",
        ]
    )
    return story


def unit4_story():
    story = unit_header(4, "Virtual Memory Management and Secondary Storage")
    story.extend(section_title("Virtual Memory and Demand Paging"))
    story.extend(
        bullet(item)
        for item in [
            "Virtual memory allows a process to execute even when only part of it is in RAM.",
            "Demand paging loads pages only when they are first referenced.",
            "Valid/invalid bit in the page table indicates whether a page is present in memory.",
        ]
    )
    story.append(
        info_box(
            "Page Fault Handling Sequence",
            [
                "1. CPU references a page whose valid bit is 0.",
                "2. Hardware traps to the OS.",
                "3. OS checks whether the address is legal; illegal reference terminates the process.",
                "4. OS finds a free frame or selects a victim using page replacement.",
                "5. Page is read from disk into the chosen frame.",
                "6. Page table is updated and valid bit set.",
                "7. Faulting instruction restarts from the beginning.",
            ],
        )
    )
    story.extend(section_title("EAT with Page Faults"))
    story.extend(
        bullet(item)
        for item in [
            "EAT = (1-p) x memory access + p x page fault service time.",
            "Because page fault service time is measured in milliseconds while memory access is nanoseconds, even tiny p values cause huge slowdown.",
            "To keep slowdown under 10%, page faults must usually be rarer than roughly 1 in hundreds of thousands of accesses.",
        ]
    )
    story.extend(section_title("Page Replacement Algorithms"))
    story.append(
        simple_table(
            ["Algorithm", "Core rule", "Strength", "Weakness"],
            [
                ["FIFO", "Replace oldest page in memory", "Easy to implement", "Can show Belady's anomaly"],
                ["Optimal", "Replace page used farthest in future", "Theoretical minimum faults", "Needs future knowledge"],
                ["LRU", "Replace least recently used page", "Good practical approximation to Optimal", "True implementation costly"],
                ["Second-chance / Clock", "FIFO plus reference bit second chance", "Cheap LRU approximation", "Still approximate"],
            ],
            [34 * mm, 63 * mm, 41 * mm, 40 * mm],
        )
    )
    story.append(
        info_box(
            "Standard Reference String Example",
            [
                "Reference string: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2 with 3 frames.",
                "FIFO faults = 9.",
                "Optimal faults = 6.",
                "LRU faults = 8.",
                "Belady's anomaly classic string: 1,2,3,4,1,2,5,1,2,3,4,5. FIFO faults: 3 frames -> 9, 4 frames -> 10.",
            ],
        )
    )
    story.extend(section_title("Clock / Second Chance"))
    story.extend(
        bullet(item)
        for item in [
            "Pages are arranged in a circle; each page has a reference bit.",
            "On replacement scan, if bit = 1, clear it and skip the page. If bit = 0, replace it.",
            "Frequently used pages keep receiving second chances and survive longer.",
        ]
    )
    story.extend(section_title("Frame Allocation and Replacement Scope"))
    story.extend(
        bullet(item)
        for item in [
            "Minimum number of frames depends on instruction-set architecture; process must have enough frames to execute at least one instruction completely.",
            "Equal allocation divides frames evenly. Proportional allocation gives more frames to larger processes. Priority allocation favors higher-priority processes.",
            "Local replacement: process can replace only its own pages. Global replacement: process can steal frames from others.",
        ]
    )
    story.extend(section_title("Thrashing"))
    story.extend(
        bullet(item)
        for item in [
            "Thrashing = process spends more time paging than executing useful work.",
            "Caused by insufficient frames for the current locality or too high a degree of multiprogramming.",
            "Working set model tracks pages used in the last Delta references. If total working-set demand exceeds available frames, the system thrashes.",
            "Page-fault-frequency control gives more frames when fault rate is too high, and takes frames back when rate is too low.",
        ]
    )
    story.extend(section_title("File Management"))
    story.extend(
        bullet(item)
        for item in [
            "File = named collection of related information on secondary storage.",
            "Attributes: name, identifier, type, location, size, protection, timestamps.",
            "Core operations: create, open, read, write, seek, close, delete, truncate.",
            "Open-file tables maintain current file position, access mode, and reference counts.",
        ]
    )
    story.extend(section_title("Directories and Protection"))
    story.append(
        simple_table(
            ["Directory type", "Key property"],
            [
                ["Single-level", "One directory for all files; no scalability or name isolation."],
                ["Two-level", "Each user has a separate user file directory."],
                ["Tree-structured", "Modern default; nested directories with absolute and relative paths."],
                ["Acyclic graph", "Allows sharing via links, but no cycles."],
                ["General graph", "Allows cycles; requires garbage collection or cycle detection."],
            ],
            [45 * mm, 133 * mm],
        )
    )
    story.extend(
        bullet(item)
        for item in [
            "UNIX permissions use owner, group, others with r, w, x bits. Example rwxr-xr-- = 754.",
            "ACLs provide per-user fine-grained permission lists beyond simple rwx triples.",
        ]
    )
    story.extend(section_title("File Allocation Methods"))
    story.append(
        simple_table(
            ["Method", "How it stores blocks", "Advantage", "Disadvantage"],
            [
                ["Contiguous", "One consecutive run of blocks", "Fast sequential and direct access", "External fragmentation, hard growth"],
                ["Linked", "Each block points to next", "Easy growth, no external fragmentation", "Poor random access, pointer overhead"],
                ["Indexed", "Index block stores pointers to all file blocks", "Direct access with no external fragmentation", "Index-block overhead"],
            ],
            [28 * mm, 52 * mm, 47 * mm, 51 * mm],
        )
    )
    story.extend(
        bullet(item)
        for item in [
            "FAT stores linked-list pointers in a central table instead of in data blocks.",
            "UNIX inode uses direct, single indirect, double indirect, and triple indirect pointers to support both small and large files efficiently.",
        ]
    )
    story.extend(section_title("Free Space Management"))
    story.extend(
        bullet(item)
        for item in [
            "Bitmap: one bit per block; easy to search for contiguous space.",
            "Free list: linked list of free blocks; simple but poor for contiguous-region search.",
            "Grouping: first free block stores addresses of many free blocks.",
            "Counting: store <start block, count> pairs for contiguous free runs.",
        ]
    )
    story.extend(section_title("Disk Structure and Access Time"))
    story.extend(
        bullet(item)
        for item in [
            "HDD concepts: platter, track, sector, cylinder, read/write head.",
            "Access time = seek + rotational latency + transfer.",
            "SSD has near-zero seek and rotational delay, but needs wear leveling and TRIM support.",
        ]
    )
    story.extend(section_title("Disk Scheduling"))
    story.append(
        info_box(
            "Classic Queue Example",
            [
                "Head starts at 53. Queue: 98, 183, 37, 122, 14, 124, 65, 67. Initial direction = high.",
                "FCFS total movement = 640.",
                "SSTF total movement = 299.",
                "SCAN total movement = 331 if moving to physical end 199 before reversing.",
                "C-SCAN total movement = 382 if moving to 199 then jumping to 0.",
                "LOOK total movement = 299 because head stops at last request 183 before reversing.",
                "C-LOOK total movement = 322 because head jumps from 183 to 14, not from 199 to 0.",
            ],
        )
    )
    story.append(
        simple_table(
            ["Algorithm", "Idea", "Starvation?"],
            [
                ["FCFS", "Serve in arrival order", "No"],
                ["SSTF", "Serve nearest request first", "Yes, distant requests may starve"],
                ["SCAN", "Sweep like elevator to end then reverse", "No"],
                ["C-SCAN", "Sweep one direction only, jump back", "No, better fairness"],
                ["LOOK", "SCAN but stop at last request, not disk end", "No"],
                ["C-LOOK", "C-SCAN but jump between extreme requests only", "No"],
            ],
            [28 * mm, 109 * mm, 41 * mm],
        )
    )
    story.extend(section_title("Swap Space, I/O, and Buddy System"))
    story.extend(
        bullet(item)
        for item in [
            "Swap may be a dedicated partition or a swap file. OS tracks free swap slots and updates PTEs to refer to swapped-out pages.",
            "Programmed I/O uses polling. Interrupt-driven I/O lets CPU do other work until device interrupts. DMA transfers bulk data directly between device and RAM.",
            "Buddy allocator manages physical memory in power-of-two blocks. Split larger block when needed; merge with free buddy on deallocation using buddy_address = block_address XOR block_size.",
            "Buddy system is fast and coalesces automatically, but can waste memory through internal fragmentation for non-power-of-two requests.",
        ]
    )
    return story


def unit5_story():
    story = unit_header(5, "RTOS and Virtualization")
    story.extend(section_title("Real-Time Systems Basics"))
    story.extend(
        bullet(item)
        for item in [
            "Real-time correctness depends on both logical correctness and delivery before deadline.",
            "Hard real-time: deadline miss is catastrophic. Soft real-time: quality degrades. Firm real-time: late result becomes useless but not catastrophic.",
            "General-purpose OS optimizes average throughput; RTOS optimizes deterministic worst-case timing.",
        ]
    )
    story.append(
        simple_table(
            ["Type", "Deadline miss effect", "Examples"],
            [
                ["Hard real-time", "System failure or unsafe behavior", "Pacemaker, ABS brakes, missile guidance"],
                ["Soft real-time", "Lower quality or degraded service", "Video, audio, gaming"],
                ["Firm real-time", "Result discarded if late", "Radar, stock decision, weather nowcast"],
            ],
            [34 * mm, 70 * mm, 74 * mm],
        )
    )
    story.extend(section_title("Task Parameters and RTOS Requirements"))
    story.extend(
        bullet(item)
        for item in [
            "Task parameters: release time r, execution time C, deadline D, period T, laxity = D - C - elapsed.",
            "Task types: periodic, aperiodic, sporadic.",
            "RTOS needs bounded interrupt latency, deterministic scheduling, predictable memory allocation, and synchronization with priority inversion control.",
            "Hard RTOS generally avoids demand paging and uncontrolled dynamic allocation.",
        ]
    )
    story.extend(section_title("RTOS Services"))
    story.extend(
        bullet(item)
        for item in [
            "Task management: create, suspend, resume, delete tasks.",
            "Priority-based preemptive scheduling: highest-priority ready task runs.",
            "Synchronization: mutexes, semaphores, event groups.",
            "Communication: queues, mailboxes, shared data with locks.",
            "Timing: delays, periodic release using absolute wake times, timers.",
            "Interrupt handling: do minimal work in ISR, defer heavy work to tasks.",
        ]
    )
    story.extend(section_title("RM and EDF"))
    story.extend(
        bullet(item)
        for item in [
            "Rate Monotonic assigns fixed priorities: shorter period -> higher priority.",
            "EDF assigns dynamic priorities: earliest absolute deadline runs first.",
            "RM schedulability sufficient condition: U <= n(2^(1/n) - 1). EDF schedulability for periodic tasks: U <= 1.",
        ]
    )
    story.append(
        info_box(
            "Worked RM / EDF Example",
            [
                "Tasks: T1(T=10,C=3), T2(T=15,C=4), T3(T=20,C=5).",
                "Utilization U = 3/10 + 4/15 + 5/20 = 0.817.",
                "RM bound for n=3 = 3(2^(1/3) - 1) = 0.7797. Because 0.817 > 0.7797, RM sufficient test fails; exact analysis required.",
                "EDF test passes because 0.817 < 1, so the task set is schedulable under EDF.",
            ],
        )
    )
    story.extend(section_title("RTOS Memory Management and FreeRTOS"))
    story.extend(
        bullet(item)
        for item in [
            "Critical RTOS tasks usually keep memory pinned in RAM; no page faults are tolerated.",
            "Preferred memory style: static allocation or fixed-size block pools with bounded allocation time.",
            "MPU provides region-based protection without full virtual memory.",
            "FreeRTOS is popular because of tiny footprint, portability, and simple API.",
        ]
    )
    story.append(
        codeblock(
            """
xTaskCreate(vMyTask, "MyTask", 256, NULL, 1, NULL);
vTaskStartScheduler();

QueueHandle_t q = xQueueCreate(10, sizeof(int));
xQueueSend(q, &value, portMAX_DELAY);
xQueueReceive(q, &received, portMAX_DELAY);

SemaphoreHandle_t m = xSemaphoreCreateMutex();
xSemaphoreTake(m, portMAX_DELAY);
xSemaphoreGive(m);
""".strip()
        )
    )
    story.extend(
        bullet(item)
        for item in [
            "Use vTaskDelayUntil() for periodic tasks to avoid drift; plain vTaskDelay() accumulates variation.",
            "ISR-safe APIs end with FromISR, such as xQueueSendFromISR and xSemaphoreGiveFromISR.",
            "Mutexes in RTOS usually support priority inheritance to handle priority inversion.",
        ]
    )
    story.extend(section_title("Fault-Tolerant RTOS"))
    story.extend(
        bullet(item)
        for item in [
            "TMR runs three copies and uses majority voting.",
            "N-version programming uses independent software implementations of the same spec.",
            "Watchdog timer resets system if critical software stops kicking it.",
            "Checkpoint and rollback restore from last known safe state after a fault.",
            "Fail-safe goes to harmless state; fail-operational keeps functioning in degraded mode.",
        ]
    )
    story.extend(section_title("Virtualization Basics"))
    story.extend(
        bullet(item)
        for item in [
            "Virtualization abstracts hardware so multiple isolated environments can run on one machine.",
            "Process VM supports one application runtime, such as JVM or .NET CLR.",
            "System VM supports a full guest OS through a hypervisor.",
        ]
    )
    story.append(
        simple_table(
            ["Type", "Where it runs", "Examples", "Main use"],
            [
                ["Type 1 hypervisor", "Directly on hardware", "ESXi, Hyper-V, Xen, KVM", "Cloud and data centers"],
                ["Type 2 hypervisor", "On top of host OS", "VirtualBox, VMware Workstation, Parallels", "Desktop development/testing"],
            ],
            [34 * mm, 52 * mm, 46 * mm, 46 * mm],
        )
    )
    story.extend(section_title("Virtualization Approaches"))
    story.append(
        simple_table(
            ["Approach", "Guest modified?", "Performance", "Key note"],
            [
                ["Hardware emulation", "No", "Slowest", "Can run different ISA on host"],
                ["Full virtualization with binary translation", "No", "Moderate", "Old x86 virtualization approach"],
                ["Paravirtualization", "Yes", "Good", "Guest uses hypercalls to VMM"],
                ["Hardware-assisted virtualization", "No", "Near-native", "VT-x, AMD-V, ARM virtualization extensions"],
                ["OS-level virtualization", "N/A", "Near-native", "Containers share host kernel"],
            ],
            [46 * mm, 28 * mm, 28 * mm, 76 * mm],
        )
    )
    story.extend(section_title("Containers and Docker"))
    story.extend(
        bullet(item)
        for item in [
            "Containers isolate processes using namespaces and cgroups while sharing the host kernel.",
            "Namespaces isolate PIDs, network, mounts, IPC, hostname, and users.",
            "cgroups limit CPU, memory, I/O, and other resources.",
            "Docker image = layered read-only template. Container = running instance with writable layer.",
            "Docker daemon manages images, containers, volumes, and networks through containerd/runc.",
        ]
    )
    story.append(
        codeblock(
            """
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]
""".strip()
        )
    )
    story.extend(section_title("Containers vs VMs"))
    story.append(
        simple_table(
            ["Feature", "Container", "Virtual machine"],
            [
                ["Kernel", "Shared host kernel", "Separate guest kernel"],
                ["Isolation", "Process-level", "Hardware-level"],
                ["Boot time", "Milliseconds", "Seconds to minutes"],
                ["Size", "MBs", "GBs"],
                ["Memory overhead", "Low", "Higher because each VM has full OS"],
                ["Best for", "Microservices, CI/CD, elastic apps", "Strong isolation, mixed OS support"],
            ],
            [32 * mm, 72 * mm, 74 * mm],
        )
    )
    story.extend(
        bullet(item)
        for item in [
            "Production often uses both: VMs for tenant isolation and containers inside them for application packaging.",
            "Containers are generally not suitable for hard RTOS use because they inherit host-kernel nondeterminism unless special real-time kernel tuning is applied.",
        ]
    )
    return story


def final_sections():
    top_questions = [
        "Explain the role and objectives of an operating system. Add key OS functions.",
        "Differentiate kernel mode and user mode. Why are system calls required?",
        "Program vs process vs thread with examples.",
        "Explain PCB and context switching.",
        "Zombie process, orphan process, and prevention methods.",
        "Draw and analyze FCFS, SJF, SRTF, RR, and priority Gantt charts.",
        "Compare preemptive and non-preemptive scheduling.",
        "Peterson's solution and three critical-section requirements.",
        "Semaphores: define wait and signal. Solve producer-consumer or readers-writers.",
        "Dining philosophers deadlock and prevention approaches.",
        "Coffman conditions and strategies for deadlock handling.",
        "Banker's Algorithm numerical with safe sequence and resource request check.",
        "Paging, TLB, and segmentation comparison.",
        "Demand paging, page-fault handling, FIFO/LRU/Optimal numerical.",
        "Thrashing, working set, page-fault-frequency control.",
        "File allocation methods and directory structures.",
        "Disk scheduling: SSTF/SCAN/LOOK/C-LOOK numerical.",
        "RTOS characteristics, RM vs EDF schedulability.",
        "FreeRTOS basics: task creation, queues, mutexes.",
        "Virtualization types, containers vs VMs, Docker architecture.",
    ]
    story = [PageBreak(), banner("High-Probability Exam Questions")]
    story.extend(bullet(q) for q in top_questions)
    story.extend(section_title("Last 10-Minute Writing Checklist"))
    story.extend(
        bullet(item)
        for item in [
            "For any numerical, write the formula first, then table, then final answer with units.",
            "In scheduling numericals, sort by arrival and show every preemption clearly in the Gantt chart.",
            "In Banker's problems, compute Need before attempting safe-sequence analysis.",
            "In page replacement, mark every hit and fault cleanly; final fault count must be boxed.",
            "In synchronization questions, state why the order of semaphore operations matters.",
            "In disk scheduling, mention the initial direction if SCAN/LOOK family is used.",
            "In short-answer comparisons, write exact point-by-point differences instead of vague prose.",
            "If a question asks for advantages and disadvantages, give both explicitly.",
            "Use the exact words mutual exclusion, progress, bounded waiting, starvation, safe state, thrashing, deadline, isolation where relevant.",
        ]
    )
    story.extend(section_title("One-Page Case Study Recall"))
    story.extend(
        bullet(item)
        for item in [
            "Zombie process: child dead, parent alive, not reaped.",
            "Lottery scheduling: tickets decide proportional CPU share.",
            "Sleeping barber: barber sleeps on wait(customers); customer leaves if no waiting chair.",
            "Android memory: Zygote + LMK + ZRAM.",
            "Buddy system: split by powers of two, merge buddies using XOR.",
            "Watchdog timer: reset if critical loop hangs.",
            "Docker: namespaces + cgroups + layered images.",
        ]
    )
    return story


def build_story():
    story = []
    story.extend(cover_story())
    story.extend(formula_card())
    story.extend(trap_card())
    story.extend(unit1_story())
    story.extend(unit2_story())
    story.extend(unit3_story())
    story.extend(unit4_story())
    story.extend(unit5_story())
    story.extend(final_sections())
    return story


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=14 * mm,
        bottomMargin=16 * mm,
        title="Operating Systems Ultimate Exam Review",
        author="OpenAI Codex",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="normal", frames=[frame], onPage=add_footer)])
    doc.build(build_story())
    return OUTPUT


if __name__ == "__main__":
    out = build_pdf()
    print(out)
